export const CHILD_COPY = Object.freeze({
  actions: Object.freeze({
    play: "Play",
    readToMe: "Read to me",
    hearAgain: "Hear it again",
    tryAgain: "Try again",
    myHollow: "My Hollow"
  }),
  signIn: Object.freeze({
    classCodeTitle: "Enter your class code",
    classCodeHelp: "Your teacher will tell you the code.",
    missingCode: "Ask your teacher for the class code.",
    noInternet: "The internet is not working. Ask your teacher.",
    askTeacher: "Ask your teacher for help.",
    whoAreYou: "Who are you?",
    pictures: "Tap your three secret pictures.",
    tryAgain: "Not yet — try again!"
  }),
  progress: Object.freeze({
    moreToGo: count => `${count} more to go`,
    complete: "You did it!"
  })
});
