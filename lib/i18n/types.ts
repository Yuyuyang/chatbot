export type Dictionary = {
  common: {
    language: {
      english: string;
      chinese: string;
    };
    action: {
      cancel: string;
      continue: string;
      delete: string;
      copy: string;
      edit: string;
      apply: string;
      dismiss: string;
      allow: string;
      deny: string;
      stop: string;
      activate: string;
      restore: string;
      latest: string;
      showChanges: string;
      loading: string;
      submitForm: string;
      uploadFiles: string;
    };
    theme: {
      toggleToDark: string;
      toggleToLight: string;
    };
    toast: {
      switchLanguageFailed: string;
    };
  };
  auth: {
    back: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    signIn: string;
    signUp: string;
    welcomeBack: string;
    signInDescription: string;
    createAccount: string;
    getStartedForFree: string;
    noAccount: string;
    haveAccount: string;
    invalidCredentials: string;
    failedValidation: string;
    accountExists: string;
    failedToCreateAccount: string;
    accountCreated: string;
    poweredBy: string;
  };
  chat: {
    title: string;
    greeting: {
      title: string;
      description: string;
    };
    composer: {
      askAnything: string;
      searchModels: string;
      loadingModels: string;
      addPhotosOrFiles: string;
      commandsTitle: string;
      slashNew: string;
      slashClear: string;
      slashRename: string;
      slashModel: string;
      slashTheme: string;
      slashDelete: string;
      slashPurge: string;
      editingMessage: string;
      editYourMessage: string;
      renameAvailable: string;
      deleteThisChat: string;
      deleteThisChatConfirm: string;
      waitForModel: string;
      failedUploadFile: string;
      failedUploadFileRetry: string;
      failedUploadFiles: string;
      failedUploadPastedImages: string;
      pastedImage: string;
    };
    history: {
      title: string;
      emptyGuest: string;
      emptyUser: string;
      today: string;
      yesterday: string;
      last7Days: string;
      last30Days: string;
      older: string;
      loading: string;
      deleteDialogTitle: string;
      deleteDialogDescription: string;
      deletedToast: string;
      summarizedToast: string;
      summarizeFailedToast: string;
      summarizeUnavailableToast: string;
    };
    navigation: {
      openSidebar: string;
      newChat: string;
      deleteAll: string;
      deleteAllTooltip: string;
      deleteAllDialogTitle: string;
      deleteAllDialogDescription: string;
      deleteAllConfirm: string;
      allChatsDeleted: string;
      signOut: string;
      share: string;
      summarize: string;
      summarizing: string;
      more: string;
    };
    userNav: {
      loading: string;
      checkingAuthStatus: string;
    };
    visibility: {
      private: {
        label: string;
        description: string;
      };
      public: {
        label: string;
        description: string;
      };
    };
    messages: {
      previousBranch: string;
      nextBranch: string;
      noTextToCopy: string;
      copiedToClipboard: string;
      upvotingResponse: string;
      upvotedResponse: string;
      failedUpvoteResponse: string;
      downvotingResponse: string;
      downvotedResponse: string;
      failedDownvoteResponse: string;
      upvoteResponse: string;
      downvoteResponse: string;
      scrollToBottom: string;
    };
    reasoning: {
      thinking: string;
      thoughtForAFewSeconds: string;
      thoughtForSeconds: string;
    };
    conversation: {
      emptyTitle: string;
      emptyDescription: string;
      downloadFilename: string;
    };
    suggestionsDialog: {
      title: string;
    };
    attachments: {
      noFilesMatchAcceptedTypes: string;
      allFilesExceedMaxSize: string;
      tooManyFilesSomeNotAdded: string;
    };
    console: {
      title: string;
      resize: string;
    };
    tools: {
      awaitingApproval: string;
      responded: string;
      running: string;
      pending: string;
      completed: string;
      denied: string;
      error: string;
      parameters: string;
      result: string;
      weatherLookupDenied: string;
      userDeniedWeatherLookup: string;
      errorCreatingDocument: string;
      errorUpdatingDocument: string;
    };
    gateway: {
      activateTitle: string;
      activateDescriptionOwner: string;
      activateDescriptionSelf: string;
    };
    artifact: {
      failedExecuteAction: string;
      sharedChatViewNotSupported: string;
      usefulForText: string;
      usefulForCode: string;
      usefulForSheet: string;
      usefulForImage: string;
      viewChanges: string;
      viewPreviousVersion: string;
      viewNextVersion: string;
      copyToClipboard: string;
      copyCodeToClipboard: string;
      copyAsCsv: string;
      copyImageToClipboard: string;
      executeCode: string;
      addFinalPolish: string;
      requestSuggestions: string;
      addComments: string;
      addLogs: string;
      formatAndCleanData: string;
      analyzeAndVisualizeData: string;
      copiedToClipboard: string;
      copiedCsvToClipboard: string;
      copiedImageToClipboard: string;
      creating: string;
      created: string;
      updating: string;
      updated: string;
      addingSuggestions: string;
      addedSuggestionsTo: string;
      forDocument: string;
      suggestion: string;
      generatingImage: string;
      fixError: string;
      adjustReadingLevelPrompt: string;
      readingLevels: {
        elementary: string;
        middleSchool: string;
        keepCurrentLevel: string;
        highSchool: string;
        college: string;
        graduate: string;
      };
    };
    weather: {
      now: string;
      hourlyForecast: string;
      sunrise: string;
      sunset: string;
      high: string;
      low: string;
    };
    suggestions: string[];
  };
};

export type TranslationValue =
  | Dictionary
  | Dictionary[keyof Dictionary]
  | string
  | string[];
