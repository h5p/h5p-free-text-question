var H5P = H5P || {};

H5P.IVOpenEndedQuestion = (function (EventDispatcher, $) {
  var counter = 0;

  var CKEditorConfig = {
    customConfig: '',
    toolbarGroups: [
      { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
      { name: 'styles', groups: [ 'styles' ] },
      { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
      { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
      { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
      { name: 'forms', groups: [ 'forms' ] },
      { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
      { name: 'colors', groups: [ 'colors' ] },
      { name: 'links', groups: [ 'links' ] },
      { name: 'insert', groups: [ 'insert' ] },
      { name: 'tools', groups: [ 'tools' ] },
      { name: 'others', groups: [ 'others' ] },
      { name: 'about', groups: [ 'about' ] }
    ],
    startupFocus: true,
    width: '100%',
    resize_enabled: false,
    linkShowAdvancedTab: false,
    linkShowTargetTab: false,
    removeButtons: 'Cut,Copy,Paste,Undo,Redo,Anchor,Subscript,Superscript,Font,BulletedList,NumberedList,Outdent,Indent,About'
  };

  // Contains a "global" mapping between editor names and callback functions
  var ckEditorCallbaks = {};

  // Have we setup our global CK Editor listener?
  var ckEditorListenerInitialized = false;

  /**
   * Loads the CK Editor dynamically
   * @param  {string}   basePath   The basepath for ckeditor files
   * @param  {string}   editorName The editor name
   * @param  {Function} onLoad     Function invoked when CKEDITOR is loaded
   * @param  {Function} onReady    Function invoked when a CKEDITOR instance is ready
   * @param  {Function} onDialogDefinition  Function invoked when a dialog defintion is ready
   * @return {undefined}
   */
  var loadCKEditor = function (basePath, editorName, onLoad, onReady, onDialogDefinition) {

    ckEditorCallbaks[editorName] = {
      onReady: onReady,
      onDialogDefinition: onDialogDefinition
    };

    var loaded = function () {
      // Make sure this is only done once.
      if (!ckEditorListenerInitialized) {
        ckEditorListenerInitialized = true;
        // Resize the CKEDITOR on initialization using jquery
        window.CKEDITOR.on('instanceReady', function(event) {
          var callbacks = ckEditorCallbaks[event.editor.name];
          if (callbacks.onReady ) {
            callbacks.onReady();
          }
        });

        // Listen to dialog definitions
        window.CKEDITOR.on('dialogDefinition', function(event) {
          var dialogDefinition = event.data.definition;

          // Configure dialogs to hide unecessary elements
          if (event.data.name == 'link') {
            var infoTab = dialogDefinition.getContents('info');
            infoTab.remove('linkType');
            infoTab.remove('anchorOptions');
            infoTab.remove('emailOptions');
          }

          var callbacks = ckEditorCallbaks[event.editor.name];
          if (callbacks.onReady ) {
            callbacks.onDialogDefinition(dialogDefinition.dialog);
          }
        });
      }

      onLoad();
    };

    if (window.CKEDITOR) {
      return loaded();
    }

    var script = document.createElement('script');
    script.onload = loaded;
    script.src = basePath + 'ckeditor.js';

    document.body.appendChild(script);
  };

  /**
   * @param       {Object}  params    The parameters
   * @param       {number}  contentId Content ID
   * @param       {Object}  extras    Extra parameters
   * @constructor
   */
  function IVOpenEndedQuestion(params, contentId, extras) {
    var self = this;
    var textAreaID = 'h5p-text-area-' + counter;
    counter++;
    var isEditing = extras.editing;
    var ck, textarea, currentCkEditorDialog, attached;

    params = $.extend({
      question: 'Question or description',
      placeholder: 'Enter your response here'
    }, params);

    /**
     * Create the open ended question element
     * @returns {HTMLElement} Wrapper for open ended question
     */
    var createOpenEndedQuestion = function () {
      self.wrapper = document.createElement('div');
      self.wrapper.classList.add('h5p-iv-open-ended-question');

      self.wrapper.appendChild(createTextWrapper());
      self.wrapper.appendChild(createInputWrapper());
      self.wrapper.appendChild(createRequiredMessageWrapper());
      self.wrapper.appendChild(createFooter());
      return self.wrapper;
    };

    /**
     * Create the wrapping element for the question text
     * @returns {HTMLElement} Question
     */
    var createTextWrapper = function () {
      self.textWrapper = document.createElement('div');
      self.textWrapper.classList.add('h5p-iv-open-ended-question-text-wrapper');

      var text = document.createElement('div');
      text.classList.add('h5p-iv-open-ended-question-text');
      text.innerHTML = params.question;

      if (params.isRequired == true) {
        var requiredText = document.createElement('div');
        requiredText.classList.add('h5p-iv-open-ended-required-text');
        requiredText.innerHTML = '*' + params.i10n.requiredText;
        self.textWrapper.appendChild(requiredText);
      }

      self.textWrapper.appendChild(text);

      return self.textWrapper;
    };

    /**
     * Create the wrapping element for the input
     * @returns {HTMLElement} Input
     */
    var createInputWrapper = function () {
      self.$inputWrapper = $('<div/>', {
        'class': 'h5p-iv-open-ended-question-input-wrapper'
      });

      textarea = document.createElement('textarea');
      textarea.classList.add('h5p-iv-open-ended-question-input');
      textarea.id = textAreaID;
      textarea.disabled = true;
      textarea.placeholder = params.placeholder;

      // Initialize the CKEditor on focus and ensure it fits
      textarea.addEventListener('focus', function() {
        ck = window.CKEDITOR.replace(textAreaID, CKEditorConfig);

        // Send an 'interacted' event every time the user exits the text area
        ck.on('blur', function() {
          createXAPIEvent('interacted', true);
        });
      });

      self.$inputWrapper.append(textarea);

      return self.$inputWrapper.get(0);
    };


    /**
     * Create the wrapping element for the warning message
     * @returns {HTMLElement} Warning message
     */
    var createRequiredMessageWrapper = function () {
      self.requiredMessageWrapper = document.createElement('div');
      self.requiredMessageWrapper.classList.add('h5p-iv-open-ended-question-required-wrapper');

      var requiredMessage = document.createElement('div');
      requiredMessage.classList.add('h5p-iv-open-ended-question-required-message');
      requiredMessage.innerHTML = params.i10n.requiredMessage;

      var requiredButton = document.createElement('button');
      requiredButton.classList.add('h5p-iv-open-ended-question-required-exit');
      requiredButton.addEventListener('click', function () {
        hideRequiredMessage();
      });

      self.requiredMessageWrapper.appendChild(requiredMessage);
      self.requiredMessageWrapper.appendChild(requiredButton);

      // Hide on creation
      hideRequiredMessage();

      return self.requiredMessageWrapper;
    };

    /**
     * @returns {string} The user response
     */
    var getResponse = function () {
      var CKEDITOR = window.CKEDITOR;
      return CKEDITOR.instances[textAreaID] !== undefined ?
        CKEDITOR.instances[textAreaID].getData().trim() : '';
    };

    /**
     * Create the footer and associated buttons
     * @returns {HTMLElement} Footer
     */
    var createFooter = function () {
      self.footer = document.createElement('div');
      self.footer.classList.add('h5p-iv-open-ended-question-footer');

      self.submitButton = document.createElement('button');
      self.submitButton.classList.add('h5p-iv-open-ended-question-button-submit');
      self.submitButton.type = 'button';
      self.submitButton.innerHTML = params.i10n.submitButtonLabel;

      self.submitButton.addEventListener('click', function () {
        if (getResponse().length !== 0 && params.isRequired) {
          showRequiredMessage();
        }
        else {
          createXAPIEvent('answered', true);
          self.trigger('continue');
        }
      });

      // Create a 'skip button' if we are allowed to
      if (params.isRequired == false) {
        var skipButton = document.createElement('button');
        skipButton.classList.add('h5p-iv-open-ended-question-button-skip');
        skipButton.type = 'button';
        skipButton.innerHTML = params.i10n.skipButtonLabel;

        skipButton.addEventListener('click', function () {
          createXAPIEvent('interacted', true);
          self.trigger('continue');
        });

        self.footer.appendChild(skipButton);
      }

      self.footer.appendChild(self.submitButton);

      return self.footer;
    };

    var showRequiredMessage = function () {
      self.requiredMessageWrapper.classList.remove('h5p-iv-open-ended-question-hidden');
    };

    var hideRequiredMessage = function () {
      self.requiredMessageWrapper.classList.add('h5p-iv-open-ended-question-hidden');
    };

    /**
     * xAPI event template builder
     *
     * @param  {String} type    Type of event
     * @param  {boolean} trigger Whether the event should be triggered
     * @return {Object}         xAPI event object
     */
    var createXAPIEvent= function(type, trigger) {
      var xAPIEvent = self.createXAPIEventTemplate(type);

      // Add question to the definition of the xAPI statement
      var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
      $.extend(definition, getXAPIDefinition(this.paramsquestion));

      // Add the response to the xAPI statement
      xAPIEvent.data.statement.result = {};
      xAPIEvent.data.statement.result.response = getResponse();

      if (trigger) {
        self.trigger(xAPIEvent);
      }

      return xAPIEvent;
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
      var XAPIEvent = createXAPIEvent('answered', false);

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

      self.submitButton.innerHTML = (widthToEmRatio <= widthToEmThreshold) ? '' : params.i10n.submitButtonLabel;

      // resize CkEditor
      resizeCKEditor();
    };

    /**
     * Destroy CKEditor before we are about to be hidden
     * @returns {undefined}
     */
    var onHide = function () {
      if (currentCkEditorDialog) {
        currentCkEditorDialog.hide();
        currentCkEditorDialog = undefined;
      }

      if (ck) {
        ck.destroy();
        ck = undefined;
      }
    };

    /**
     * Resize the CK Editor
     * @returns {undefined}
     */
    var resizeCKEditor = function() {
      // Do nothing if I am not visible or if the CK instance is not created yet
      if (!self.$container.is(':visible') || ck === undefined) {
        return;
      }

      var containerHeight = self.$inputWrapper.height();
      ck.resize(CKEditorConfig.width, containerHeight-3, false, true);
    };

    /**
     * Resize the CK Editor Dialogs
     * @param  {CKEDITOR.Dialog} dialog The dialog to resize
     * @returns {undefined}
     */
    var resizeCkEditorDialog = function (dialog) {
      // Not nice to get the parent's $container, but we dont have any nice
      // ways of doing this
      var ivHeight = extras.parent.$container.height();
      var dialogElement = dialog.getElement();
      var dialogBodyElement = dialogElement.find('.cke_dialog_body').$[0];
      $(dialogBodyElement).css({
        'max-height': ivHeight,
        'overflow-y': 'scroll'
      });

      var dialogContents = dialogElement.find('.cke_dialog_contents').$[0];
      $(dialogContents).css('margin-top', 0);

      // Resize link dialog
      var dialogContentsBody = dialogElement.find('.cke_dialog_contents_body').$[0];
      $(dialogContentsBody).css('height', 'inherit');
    };

    /**
     * Setup CK Editor dialogs
     * @param {CKEDITOR.Dialog} dialog The dialog
     * @returns {undefined}
     */
    var onDialogDefinition = function (dialog) {
      // Prevent overflowing out of H5P iframe
      dialog.on('show', function () {
        currentCkEditorDialog = this;

        self.on('resize', resizeCkEditorDialog.bind(self, this));
        resizeCkEditorDialog(this);
      });

      dialog.on('hide', function () {
        self.off('resize', resizeCkEditorDialog);
        currentCkEditorDialog = undefined;
      });
    };

    /**
     * Enable the textarea
     * @returns {undefined}
     */
    var enableTextarea = function () {
      // Enable the textarea
      textarea.disabled = false;
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
      var ckEditorBase = self.getLibraryFilePath('ckeditor/');

      $container.get(0).classList.add('h5p-iv-open-ended-question-wrapper');
      $container.append(createOpenEndedQuestion());

      // Don't load CKEditor if
      // -- in editor (will break the ckeditor provided by the H5P editor)
      // -- attach has been run previously
      // Note: Can't do this in the constructor, since the getLibraryFilePath
      // will fail at that time
      if (!isEditing && !attached) {
        loadCKEditor(ckEditorBase, textAreaID, enableTextarea, resizeCKEditor, onDialogDefinition);
      }
      else {
        enableTextarea();
      }
      attached = true;

      self.on('resize', onResize);
      self.on('hide', onHide);
    };
  }

  // Extends the event dispatcher
  IVOpenEndedQuestion.prototype = Object.create(EventDispatcher.prototype);
  IVOpenEndedQuestion.prototype.constructor = IVOpenEndedQuestion;

  return IVOpenEndedQuestion;
})(H5P.EventDispatcher, H5P.jQuery);
