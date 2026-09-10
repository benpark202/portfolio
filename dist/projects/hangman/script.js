const MAX_WRONG_GUESSES = 6;
const WORD_BANK = [
    {
        word: "TYPESCRIPT",
        hint: "The language used for this project."
    },
    {
        word: "ACCESSIBLE",
        hint: "A good interface works for everyone."
    },
    {
        word: "RESPONSIVE",
        hint: "Design that adapts to screen size."
    },
    {
        word: "COMPONENT",
        hint: "A reusable block of UI."
    },
    {
        word: "BLUEPRINT",
        hint: "A plan before building."
    }
];
const wordDisplay = document.getElementById("word-display");
const message = document.getElementById("message");
const newGameButton = document.getElementById("new-game");
const hintButton = document.getElementById("hint-button");
const remainingLabel = document.getElementById("remaining-label");
const roundLabel = document.getElementById("round-label");
const hangmanParts = Array.from(document.querySelectorAll("[data-part]"));
if (!wordDisplay || !message || !newGameButton || !hintButton || !remainingLabel || !roundLabel) {
    throw new Error("Hangman game elements are missing.");
}
const state = {
    round: 0,
    activeWordIndex: 0,
    guessedLetters: new Set(),
    wrongLetters: new Set(),
    solved: false,
    finished: false,
    hintUsed: false
};
const getActiveWord = ()=>WORD_BANK[state.activeWordIndex];
const normalizeLetter = (value)=>value.trim().toUpperCase().slice(0, 1);
const renderWord = ()=>{
    const activeWord = getActiveWord();
    const letters = activeWord.word.split("");
    wordDisplay.innerHTML = "";
    for (const letter of letters){
        const tile = document.createElement("span");
        tile.className = "letter-tile";
        if (letter === " ") {
            tile.classList.add("is-space");
            tile.textContent = "";
            wordDisplay.append(tile);
            continue;
        }
        const visible = state.guessedLetters.has(letter);
        tile.classList.toggle("is-hidden", !visible);
        tile.textContent = visible ? letter : "•";
        wordDisplay.append(tile);
    }
};
const renderHangman = ()=>{
    const wrongCount = state.wrongLetters.size;
    hangmanParts.forEach((part, index)=>{
        part.classList.toggle("is-visible", index < wrongCount);
    });
};
const renderStatus = ()=>{
    const remaining = Math.max(MAX_WRONG_GUESSES - state.wrongLetters.size, 0);
    remainingLabel.textContent = String(remaining);
    roundLabel.textContent = String(state.round);
};
const setMessage = (text)=>{
    message.textContent = text;
};
const updateFinishedState = ()=>{
    const activeWord = getActiveWord().word;
    const lettersToSolve = new Set(activeWord.replace(/\s+/g, "").split(""));
    const solved = Array.from(lettersToSolve).every((letter)=>state.guessedLetters.has(letter));
    state.solved = solved;
    state.finished = solved || state.wrongLetters.size >= MAX_WRONG_GUESSES;
    if (solved) {
        setMessage(`You solved it. The word was ${activeWord}.`);
        return;
    }
    if (state.finished) {
        setMessage(`Game over. The word was ${activeWord}.`);
    }
};
const syncUI = ()=>{
    renderWord();
    renderHangman();
    renderStatus();
    updateFinishedState();
};
const handleGuess = (rawLetter)=>{
    if (state.finished) return;
    const letter = normalizeLetter(rawLetter);
    if (!letter || state.guessedLetters.has(letter) || state.wrongLetters.has(letter)) return;
    const activeWord = getActiveWord().word;
    if (activeWord.includes(letter)) {
        state.guessedLetters.add(letter);
        const guessedWord = activeWord.replace(/\s+/g, "").split("").every((item)=>state.guessedLetters.has(item));
        setMessage(`Good guess: ${letter}.`);
        if (guessedWord) {
            state.solved = true;
            state.finished = true;
            setMessage(`You solved it. The word was ${activeWord}.`);
        }
    } else {
        state.wrongLetters.add(letter);
        setMessage(`No ${letter}. Try again.`);
        if (state.wrongLetters.size >= MAX_WRONG_GUESSES) {
            state.finished = true;
            setMessage(`Game over. The word was ${activeWord}.`);
        }
    }
    syncUI();
};
const startNewRound = ()=>{
    state.round += 1;
    state.activeWordIndex = Math.floor(Math.random() * WORD_BANK.length);
    state.guessedLetters = new Set();
    state.wrongLetters = new Set();
    state.solved = false;
    state.finished = false;
    state.hintUsed = false;
    setMessage("Make your first guess.");
    syncUI();
};
const revealHint = ()=>{
    if (state.finished || state.hintUsed) return;
    state.hintUsed = true;
    setMessage(`Hint: ${getActiveWord().hint}`);
};
newGameButton.addEventListener("click", startNewRound);
hintButton.addEventListener("click", revealHint);
document.addEventListener("keydown", (event)=>{
    const key = normalizeLetter(event.key);
    if (!key || key.length !== 1 || !/^[A-Z]$/.test(key)) return;
    handleGuess(key);
});
startNewRound();
