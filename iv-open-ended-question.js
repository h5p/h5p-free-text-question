var H5P = H5P || {};
H5P.CKEDITOR = CKEDITOR;

H5P.IVOpenEndedQuestion = (function (EventDispatcher, $, CKEDITOR) {

  function IVOpenEndedQuestion(params, id, contentData) {
    var self = this;
    var textAreaID = 'h5p-text-area-' + contentData.subContentId;
    var ck;

    params = $.extend({
      question: 'Question or description',
      placeholder: 'Enter your response here'
    }, params);

    var CKEditorConfig = {
      toolbarGroups : [
        { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
        { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
        { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
        { name: 'forms', groups: [ 'forms' ] },
        { name: 'styles', groups: [ 'styles' ] },
        { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
        { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
        { name: 'colors', groups: [ 'colors' ] },
        { name: 'links'},
        { name: 'tools', groups: [ 'tools' ] },
        { name: 'others', groups: [ 'others' ] },
        { name: 'about', groups: [ 'about' ] },
        { name: 'insert', groups: [ 'insert' ] }
      ],
      removeButtons : 'Source,Save,NewPage,Preview,Print,Templates,Cut,Copy,Paste,PasteText,PasteFromWord,Redo,Undo,Find,Replace,Scayt,SelectAll,Form,Checkbox,Radio,Select,Textarea,TextField,Button,ImageButton,HiddenField,Subscript,Superscript,CopyFormatting,RemoveFormat,NumberedList,BulletedList,Indent,Blockquote,Outdent,CreateDiv,BidiLtr,BidiRtl,JustifyLeft,JustifyBlock,JustifyRight,JustifyCenter,Language,Anchor,Image,Flash,HorizontalRule,PageBreak,Iframe,SpecialChar,Styles,ShowBlocks,Maximize,About,Font,Smiley',
      startupFocus : true,
      width : '100%',
      resize_enabled : false,
      linkShowAdvancedTab : false,
      linkShowTargetTab :  false
    };

    // Ensure dialog doesn't overflow out of iframe
    CKEDITOR.on('dialogDefinition', function(e) {
      var dialogDefinition = e.data.definition;
      var dialogName = e.data.name;

      // Configure dialogs to hide unecessary elements
      if (dialogName == 'link') {
        var infoTab = dialogDefinition.getContents('info');
        infoTab.remove('linkType');
        infoTab.remove('anchorOptions');
        infoTab.remove('emailOptions');
      }

      if (dialogName == 'table') {
        dialogDefinition.removeContents('advanced');
      }

      // Prevent overflowing out of H5P iframe
      dialogDefinition.onShow = function () {
        var dialogBodyElement = this.getElement().find('.cke_dialog_body').$[0];
        $(dialogBodyElement).css({
          'max-height': 250,  // Hardcoded max height
          'overflow-y': 'scroll'
        });

        var dialogContents = this.getElement().find('.cke_dialog_contents').$[0];
        $(dialogContents).css('margin-top', 0);

        // Resize link dialog
        var dialogContentsBody = this.getElement().find('.cke_dialog_contents_body').$[0];
        $(dialogContentsBody).css('height', 'inherit');
      };
    });

    /**
     * Create the open ended question element
     * @returns {HTMLElement} Wrapper for open ended question
     */
    var createOpenEndedQuestion = function () {
      var wrapper = document.createElement('div');
      wrapper.classList.add('h5p-iv-open-ended-question');

      wrapper.append(createTextWrapper());
      wrapper.append(createInputWrapper());
      wrapper.append(createRequiredMessageWrapper());
      wrapper.append(createFooter());
      self.wrapper = wrapper;
      return wrapper;
    };

    /**
     * Create the wrapping element for the question text
     * @returns {HTMLElement} Question
     */
    var createTextWrapper = function () {
      var textWrapper = document.createElement('div');
      textWrapper.classList.add('h5p-iv-open-ended-question-text-wrapper');

      var text = document.createElement('div');
      text.classList.add('h5p-iv-open-ended-question-text');
      text.innerHTML = params.question;

      if (params.isRequired == true) {
        var requiredText = document.createElement('div');
        requiredText.classList.add('h5p-iv-open-ended-required-text');
        requiredText.innerHTML = '*' + params.i10n.requiredText;
        textWrapper.append(requiredText);
      }

      textWrapper.append(text);
      self.textWrapper = textWrapper;

      return textWrapper;
    };

    /**
     * Create the wrapping element for the input
     * @returns {HTMLElement} Input
     */
    var createInputWrapper = function () {
      var $inputWrapper = $('<div/>', {
        'class': 'h5p-iv-open-ended-question-input-wrapper'
      });

      var input = document.createElement('textarea');
      input.classList.add('h5p-iv-open-ended-question-input');
      input.id = textAreaID;
      input.rows = params.inputRows;
      input.placeholder = params.placeholder;

      // Initialize the CKEditor on focus and ensure it fits
      input.addEventListener('focus', function() {
        ck = CKEDITOR.replace(textAreaID, CKEditorConfig);

        CKEDITOR.on('instanceLoaded', function() {
          // Resize the CKEDITOR using jquery
          var containerHeight = $inputWrapper.height();
          var toolBarHeight = $inputWrapper.find('.cke_top').outerHeight();
          var editorFooterHeight = $inputWrapper.find('.cke_bottom').outerHeight();
          var offset = toolBarHeight + editorFooterHeight + 3;
          var padding = parseInt($inputWrapper.css('padding').replace(/[^-\d\.]/g, ''));

          var realHeight = containerHeight - offset;
          var minHeight = 80;

          if (realHeight > minHeight) {
            $inputWrapper.find('.cke_contents').css('height', realHeight);
          }
          else {
            $inputWrapper.find('.cke_contents').css('height', minHeight);
            var header = $(self.textWrapper).outerHeight();
            var footer = $(self.footer).outerHeight();
            $(self.wrapper).css('min-height', minHeight + offset + padding + padding + header + footer);
          }
        });

        // Send an 'interacted' event every time the user exits the text area
        ck.on('blur', function() {
          var xAPIEvent = self.createXAPIEventTemplate('interacted');
          addQuestionToXAPI(xAPIEvent, params.question);
          addResponseToXAPI(xAPIEvent, input.value);
          self.trigger(xAPIEvent);
        });
      });

      $inputWrapper.append(input);

      return $inputWrapper.get(0);
    };

    /**
     * Create the wrapping element for the warning message
     * @returns {HTMLElement} Warning message
     */
    var createRequiredMessageWrapper = function () {
      var requiredMessageWrapper = document.createElement('div');
      requiredMessageWrapper.classList.add('h5p-iv-open-ended-question-required-wrapper');

      var requiredMessage = document.createElement('div');
      requiredMessage.classList.add('h5p-iv-open-ended-question-required-message');
      requiredMessage.innerHTML = params.i10n.requiredMessage;

      var requiredButton = document.createElement('button');
      requiredButton.classList.add('h5p-iv-open-ended-question-required-exit');
      requiredButton.addEventListener('click', function () {
        self.hideRequiredMessage();
      });

      requiredMessageWrapper.append(requiredMessage);
      requiredMessageWrapper.append(requiredButton);

      self.requiredMessageWrapper = requiredMessageWrapper;

      // Hide on creation
      self.hideRequiredMessage();

      return requiredMessageWrapper;
    };

    /**
     * Create the footer and associated buttons
     * @returns {HTMLElement} Footer
     */
    var createFooter = function () {
      var footer = document.createElement('div');
      footer.classList.add('h5p-iv-open-ended-question-footer');

      var submitButton = document.createElement('button');
      submitButton.classList.add('h5p-iv-open-ended-question-button-submit');
      submitButton.type = 'button';
      submitButton.innerHTML = params.i10n.submitButtonLabel;

      submitButton.addEventListener('click', function () {

        // Editor doesn't exist until the user clicks on the textarea
        if (CKEDITOR.instances[textAreaID] === undefined) {
          if (params.isRequired) {
            self.showRequiredMessage();
          }
          else {
            var xAPIEvent = self.createXAPIEventTemplate('answered');
            addQuestionToXAPI(xAPIEvent, params.question);
            addResponseToXAPI(xAPIEvent, '');
            self.trigger(xAPIEvent);
            self.trigger('continue');
          }
        }

        // Show the required message if the user hasn't inputted anything
        else if (CKEDITOR.instances[textAreaID].getData().trim() === '' && params.isRequired) {
          self.showRequiredMessage();
        }
        else {
          var xAPIEvent = self.createXAPIEventTemplate('answered');
          addQuestionToXAPI(xAPIEvent, params.question);
          addResponseToXAPI(xAPIEvent, CKEDITOR.instances[textAreaID].getData());
          self.trigger(xAPIEvent);
          self.trigger('continue');
        }
      });

      if (params.isRequired == false) {
        var skipButton = document.createElement('button');
        skipButton.classList.add('h5p-iv-open-ended-question-button-skip');
        skipButton.type = 'button';
        skipButton.innerHTML = params.i10n.skipButtonLabel;

        skipButton.addEventListener('click', function () {
          var xAPIEvent = self.createXAPIEventTemplate('interacted');
          addQuestionToXAPI(xAPIEvent, params.question);
          self.trigger(xAPIEvent);
          self.trigger('continue');
        });

        footer.append(skipButton);
      }

      footer.append(submitButton);
      self.footer = footer;
      self.submitButton = submitButton;

      return footer;
    };

    self.showRequiredMessage = function () {
      self.requiredMessageWrapper.classList.remove('h5p-iv-open-ended-question-hidden');
    };

    self.hideRequiredMessage = function () {
      self.requiredMessageWrapper.classList.add('h5p-iv-open-ended-question-hidden');
    };

    /**
     * Add the question itself to the definition part of an xAPIEvent
     * @param {Object} xAPIEvent xAPI event template created from Core
     * @param {String} question Question
     * @returns {null} null
     */
    var addQuestionToXAPI = function (xAPIEvent, question) {
      var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
      $.extend(definition, getXAPIDefinition(question));
    };

    /**
     * Add a response to the definition part of an xAPIEvent
     * @param {Object} xAPIEvent xAPI event template created from Core
     * @param {String} response Response
     * @returns {null} null
     */
    var addResponseToXAPI = function (xAPIEvent, response) {
      xAPIEvent.data.statement.result = {};
      xAPIEvent.data.statement.result.response = response + ''; // Convert to a string
    };

    /**
     * Create a definition template
     * @param {String} question Question
     * @returns {Object} xAPI definition template
     */
    var getXAPIDefinition = function (question) {
      var definition = {};

      definition.interactionType = 'fill-in';
      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
      definition.description = {
        'en-US': question // We don't know the language at runtime
      };
      definition.extensions = {
        'https://h5p.org/x-api/h5p-machine-name': 'H5P.IVOpenEndedQuestion'
      };

      return definition;
    };

    /**
     * Get xAPI data.
     * Contract used by report rendering engine.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     * @returns {Object} xAPI data statement
     */
    self.getXAPIData = function () {
      var XAPIEvent = this.createXAPIEventTemplate('answered');
      addQuestionToXAPI(XAPIEvent, this.params.question);
      addResponseToXAPI(XAPIEvent, (CKEDITOR.instances[textAreaID] ? CKEDITOR.instances[textAreaID].getData() : ''));

      return {
        statement: XAPIEvent.data.statement
      };
    };

    /**
     * Listen to resize events in order to use smaller buttons
     * @returns {undefined}
     */
    var onResize = function() {
      var footerWidth = $(self.$container).width();
      var fontSize = parseInt($(self.$container).css('font-size'), 10);
      var widthToEmRatio = footerWidth / fontSize;
      var widthToEmThreshold = 23;

      if (widthToEmRatio <= widthToEmThreshold) {
        self.submitButton.innerHTML = '';
      }
      else {
        self.submitButton.innerHTML = params.i10n.submitButtonLabel;
      }
    };

    /**
     * Attach function called by H5P framework to insert H5P content into
     * page
     *
     * @param {jQuery} $container H5P Container the open ended question will be attached to
     * @returns {null} null
     */
    self.attach = function ($container) {
      self.$container = $container;
      $container.get(0).classList.add('h5p-iv-open-ended-question-wrapper');
      var question = createOpenEndedQuestion();
      $container.append(question);
      self.on('resize', onResize);
    };
  }

  // Extends the event dispatcher
  IVOpenEndedQuestion.prototype = Object.create(EventDispatcher.prototype);
  IVOpenEndedQuestion.prototype.constructor = IVOpenEndedQuestion;

  return IVOpenEndedQuestion;
})(H5P.EventDispatcher, H5P.jQuery, H5P.CKEDITOR);
