var H5P = H5P || {};

H5P.IVOpenEndedQuestion = (function (EventDispatcher, $) {

  function IVOpenEndedQuestion(params, id) {
    var self = this;
    self.id = id;

    self.params = $.extend({}, {
      question: 'Question or description',
      placeholder: 'Enter your response here'
    }, params);

    /**
     * Create the open ended question element
     * @returns {HTMLElement} Wrapper for open ended question
     */
    var createOpenEndedQuestion = function () {
      var wrapper = document.createElement('div');
      wrapper.classList.add('h5p-iv-open-ended-question');

      var questionWrapper = document.createElement('div');
      questionWrapper.classList.add('h5p-iv-open-ended-question-question-wrapper');

      var textWrapper = createTextWrapper();
      var inputWrapper = createInputWrapper();
      var requiredMessageWrapper = createRequiredMessageWrapper();
      self.requiredMessageWrapper = requiredMessageWrapper;

      questionWrapper.append(textWrapper);
      questionWrapper.append(inputWrapper);

      wrapper.append(questionWrapper);
      wrapper.append(requiredMessageWrapper);
      wrapper.append(createFooter());
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
      text.innerHTML = self.params.question;

      if (self.params.isRequired === true) {
        var requiredText = document.createElement('div');
        requiredText.classList.add('h5p-iv-open-ended-required-text');
        requiredText.innerHTML = '*' + self.params.i10n.requiredText;
        textWrapper.append(requiredText);
      }

      textWrapper.append(text);

      return textWrapper;
    };

    /**
     * Create the wrapping element for the input
     * @returns {HTMLElement} Input
     */
    var createInputWrapper = function () {
      var inputWrapper = document.createElement('div');
      inputWrapper.classList.add('h5p-iv-open-ended-question-input-wrapper');

      var input = document.createElement('textarea');
      input.classList.add('h5p-iv-open-ended-question-input');
      input.rows = self.params.inputRows;
      input.style.resize = 'none';
      input.placeholder = self.params.placeholder;

      input.addEventListener('blur', function () {
        var xAPIEvent = self.createXAPIEventTemplate('interacted');
        addQuestionToXAPI(xAPIEvent, self.params.question);
        addResponseToXAPI(xAPIEvent, input.value);
        self.trigger(xAPIEvent);
      });

      self.input = input; // TODO place one level higher
      inputWrapper.append(input);

      return inputWrapper;
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
      requiredMessage.innerHTML = self.params.i10n.requiredMessage;

      var requiredButton = document.createElement('button');
      requiredButton.classList.add('h5p-iv-open-ended-question-required-exit');
      requiredButton.addEventListener('click', function () {
        self.hideRequiredMessage();
      });

      requiredMessageWrapper.append(requiredMessage);
      requiredMessageWrapper.append(requiredButton);

      // Hide on creation
      requiredMessageWrapper.style.display = 'none';

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
      submitButton.innerHTML = self.params.i10n.submitButtonLabel;

      submitButton.addEventListener('click', function () {
        if (self.input.value.trim() === '') {
          self.showRequiredMessage();
        }
        else {
          var xAPIEvent = self.createXAPIEventTemplate('answered');
          addQuestionToXAPI(xAPIEvent, self.params.question);
          addResponseToXAPI(xAPIEvent, self.input.value);
          self.trigger(xAPIEvent);
          self.trigger('continue');
        }
      });

      if (self.params.isRequired === false) {
        var skipButton = document.createElement('button');
        skipButton.classList.add('h5p-iv-open-ended-question-button-skip');
        skipButton.type = 'button';
        skipButton.innerHTML = self.params.i10n.skipButtonLabel;

        skipButton.addEventListener('click', function () {
          var xAPIEvent = self.createXAPIEventTemplate('interacted');
          addQuestionToXAPI(xAPIEvent, self.params.question);
          addResponseToXAPI(xAPIEvent, self.input.value);
          self.trigger(xAPIEvent);
        });

        footer.append(skipButton);
      }

      footer.append(submitButton);

      return footer;
    };

    self.showRequiredMessage = function () {
      self.requiredMessageWrapper.style.display = '';
    };

    self.hideRequiredMessage = function () {
      self.requiredMessageWrapper.style.display = 'none';
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

      return definition;
    };

    /**
     * Attach function called by H5P framework to insert H5P content into
     * page
     *
     * @param {jQuery} $container H5P Container the open ended question will be attached to
     * @returns {null} null
     */
    self.attach = function ($container) {
      $container.get(0).classList.add('h5p-iv-open-ended-question-wrapper');
      var question = createOpenEndedQuestion();
      $container.append(question);
    };
  }

  // Extends the event dispatcher
  IVOpenEndedQuestion.prototype = Object.create(EventDispatcher.prototype);
  IVOpenEndedQuestion.prototype.constructor = IVOpenEndedQuestion;

  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,"");
  };

  return IVOpenEndedQuestion;
})(H5P.EventDispatcher, H5P.jQuery);
