// export const emojiRegex = /[\p{Extended_Pictographic}|\p{Emoji_Presentation}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{E000}-\u{F8FF}\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F093}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F300}-\u{1F5FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{24FF}\u{25A0}-\u{25FF}\u{2900}-\u{297F}\u{2B00}-\u{2BFF}]/gu;

// Matches emoji, ZWJ sequences, skin tone modifiers, flags, and variation selectors
export const emojiRegex =
  /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|[\u{1F1E6}-\u{1F1FF}]{2})/gu

export const API_URL = import.meta.env.PROD
  ? "http://dev.autosweeprfidapps.com/api/v3/portalnew"
  : "https://portalnew.test"

const WEBPORTAL_SERVICE =
  "https://autosweeprfid.com/WebService/WebPortalServices"

export const CUSTOMER_CARE_API_URL = WEBPORTAL_SERVICE + "/customercare.php"

export const FAQ_API_URL = WEBPORTAL_SERVICE + "/faq.php"

export const APP_NAME = "Autosweep Customer Portal"

export const APP_VERSION = "1.0.0"
