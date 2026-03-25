"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ShuffleIcon, ChevronRightIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = "funny" | "deep" | "impossible" | "absurd"

type Prompt = {
  id: number
  category: Category
  optionA: string
  optionB: string
}

type VoteRecord = {
  a: number
  b: number
  userVote: "a" | "b"
}

type VoteStore = Record<number, VoteRecord>

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "wyr-votes"

const CATEGORY_LABELS: Record<Category | "all", string> = {
  all: "All",
  funny: "Funny",
  deep: "Deep",
  impossible: "Impossible",
  absurd: "Absurd",
}

const CATEGORY_COLORS: Record<Category, string> = {
  funny: "bg-amber-500/10 text-amber-400",
  deep: "bg-indigo-500/10 text-indigo-400",
  impossible: "bg-rose-500/10 text-rose-400",
  absurd: "bg-emerald-500/10 text-emerald-400",
}

const PROMPTS: Prompt[] = [
  // Funny (~15)
  { id: 1, category: "funny", optionA: "Have fingers as long as your legs", optionB: "Have legs as long as your fingers" },
  { id: 2, category: "funny", optionA: "Always have to sing instead of speaking", optionB: "Always have to dance instead of walking" },
  { id: 3, category: "funny", optionA: "Have a permanent clown nose", optionB: "Have permanent clown shoes" },
  { id: 4, category: "funny", optionA: "Sneeze glitter for the rest of your life", optionB: "Burp confetti for the rest of your life" },
  { id: 5, category: "funny", optionA: "Have your thoughts appear as subtitles above your head", optionB: "Have a laugh track play every time you fail at something" },
  { id: 6, category: "funny", optionA: "Only be able to communicate through memes", optionB: "Only be able to communicate through interpretive dance" },
  { id: 7, category: "funny", optionA: "Have a rewind button for your life but everyone watches", optionB: "Have a pause button but you can't move either" },
  { id: 8, category: "funny", optionA: "Always smell like freshly baked cookies", optionB: "Always have animals attracted to you wherever you go" },
  { id: 9, category: "funny", optionA: "Have spaghetti for hair", optionB: "Sweat maple syrup" },
  { id: 10, category: "funny", optionA: "Speak every language fluently but only in a whisper", optionB: "Speak only your native language but always at full volume" },
  { id: 11, category: "funny", optionA: "Have to wear a cape everywhere you go", optionB: "Have to carry a boombox playing your theme song everywhere" },
  { id: 12, category: "funny", optionA: "Have taste buds on your hands", optionB: "Have a nose on the bottom of each foot" },
  { id: 13, category: "funny", optionA: "Only be able to wash your hair with ketchup", optionB: "Only be able to brush your teeth with hot sauce" },
  { id: 14, category: "funny", optionA: "Accidentally reply-all to every email you send", optionB: "Accidentally like every social media post you see" },
  { id: 15, category: "funny", optionA: "Have a voice that sounds like Morgan Freeman", optionB: "Have a laugh that sounds like a dolphin" },

  // Deep/Philosophical (~15)
  { id: 16, category: "deep", optionA: "Know how you will die", optionB: "Know when you will die" },
  { id: 17, category: "deep", optionA: "Be able to change the past", optionB: "Be able to see the future" },
  { id: 18, category: "deep", optionA: "Live a short life full of adventure", optionB: "Live a long peaceful but uneventful life" },
  { id: 19, category: "deep", optionA: "Know the absolute truth about everything", optionB: "Be blissfully ignorant but always happy" },
  { id: 20, category: "deep", optionA: "Be remembered for something you didn't do", optionB: "Be forgotten for something amazing you actually did" },
  { id: 21, category: "deep", optionA: "Have the power to read everyone's mind", optionB: "Have the power to make everyone forget you" },
  { id: 22, category: "deep", optionA: "Relive the happiest day of your life on loop forever", optionB: "Never be happy again but experience everything new" },
  { id: 23, category: "deep", optionA: "Know the meaning of life", optionB: "Find your own purpose without ever knowing if it's right" },
  { id: 24, category: "deep", optionA: "Be the smartest person alive but always alone", optionB: "Be average intelligence but deeply connected to others" },
  { id: 25, category: "deep", optionA: "Live in a world without music", optionB: "Live in a world without color" },
  { id: 26, category: "deep", optionA: "Have every person you meet instantly trust you", optionB: "Be able to always tell when someone is lying" },
  { id: 27, category: "deep", optionA: "Experience everything twice (good and bad)", optionB: "Experience everything once but with perfect memory" },
  { id: 28, category: "deep", optionA: "Be born 200 years in the past", optionB: "Be born 200 years in the future" },
  { id: 29, category: "deep", optionA: "Have one wish granted today", optionB: "Have three wishes granted in 20 years" },
  { id: 30, category: "deep", optionA: "Lose all your memories but keep your personality", optionB: "Keep all your memories but have a completely different personality" },

  // Impossible choices (~10)
  { id: 31, category: "impossible", optionA: "Never use the internet again", optionB: "Never travel more than 50 miles from home again" },
  { id: 32, category: "impossible", optionA: "Give up all your savings for your dream job", optionB: "Keep a boring job but double your salary" },
  { id: 33, category: "impossible", optionA: "Never eat your favorite food again", optionB: "Only eat your favorite food for every meal" },
  { id: 34, category: "impossible", optionA: "Give up air conditioning and heating forever", optionB: "Give up your phone and computer forever" },
  { id: 35, category: "impossible", optionA: "Never be able to sleep in past 5 AM", optionB: "Never be able to stay up past 9 PM" },
  { id: 36, category: "impossible", optionA: "Have unlimited money but no friends", optionB: "Be broke but have the best friends in the world" },
  { id: 37, category: "impossible", optionA: "Always be 10 minutes late", optionB: "Always be 20 minutes early" },
  { id: 38, category: "impossible", optionA: "Never listen to music again", optionB: "Never watch a movie or TV show again" },
  { id: 39, category: "impossible", optionA: "Live without hot water", optionB: "Live without a washing machine" },
  { id: 40, category: "impossible", optionA: "Only wear formal clothes forever", optionB: "Only wear pajamas forever" },

  // Absurd (~10)
  { id: 41, category: "absurd", optionA: "Fight 100 duck-sized horses", optionB: "Fight 1 horse-sized duck" },
  { id: 42, category: "absurd", optionA: "Have a pet dinosaur", optionB: "Have a pet dragon (but it's the size of a cat)" },
  { id: 43, category: "absurd", optionA: "Everything you touch turns to cheese", optionB: "Everything you sit on is slightly damp" },
  { id: 44, category: "absurd", optionA: "Be able to talk to squirrels", optionB: "Be able to breathe underwater but only in bathtubs" },
  { id: 45, category: "absurd", optionA: "Have a tail that wags when you're happy", optionB: "Have ears that perk up when you're interested" },
  { id: 46, category: "absurd", optionA: "Every step you take makes a squeaky toy sound", optionB: "Every time you sit down you hear a trombone" },
  { id: 47, category: "absurd", optionA: "Be haunted by a friendly ghost who narrates your life", optionB: "Have a tiny angel and devil on your shoulders giving real advice" },
  { id: 48, category: "absurd", optionA: "Rain tacos once a week", optionB: "Have a fountain of chocolate milk in your backyard" },
  { id: 49, category: "absurd", optionA: "Be able to fly but only 2 feet off the ground", optionB: "Be invisible but only when nobody is looking" },
  { id: 50, category: "absurd", optionA: "Have a personal narrator who follows you everywhere", optionB: "Have background music that changes with your mood" },
]

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

function loadVotes(): VoteStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as VoteStore
  } catch {
    /* ignore corrupt data */
  }
  return {}
}

function saveVotes(votes: VoteStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WouldYouRather() {
  const [votes, setVotes] = useState<VoteStore>(loadVotes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filter, setFilter] = useState<Category | "all">("all")
  const [animatingVote, setAnimatingVote] = useState<"a" | "b" | null>(null)

  const filteredPrompts = useMemo(
    () => (filter === "all" ? PROMPTS : PROMPTS.filter((p) => p.category === filter)),
    [filter],
  )

  const answeredCount = useMemo(
    () => filteredPrompts.filter((p) => votes[p.id]).length,
    [filteredPrompts, votes],
  )

  const prompt = filteredPrompts[currentIndex] as Prompt | undefined
  const currentVote = prompt ? votes[prompt.id] : undefined
  const hasVoted = !!currentVote

  const castVote = useCallback(
    (choice: "a" | "b") => {
      if (!prompt || hasVoted) return
      setAnimatingVote(choice)
      const existing = votes[prompt.id]
      const updated: VoteRecord = {
        a: (existing?.a ?? 0) + (choice === "a" ? 1 : 0),
        b: (existing?.b ?? 0) + (choice === "b" ? 1 : 0),
        userVote: choice,
      }
      const next = { ...votes, [prompt.id]: updated }
      setVotes(next)
      saveVotes(next)
      // Clear animation flag after bar finishes
      setTimeout(() => setAnimatingVote(null), 600)
    },
    [prompt, hasVoted, votes],
  )

  const goNext = useCallback(() => {
    if (filteredPrompts.length === 0) return
    setCurrentIndex((i) => (i + 1) % filteredPrompts.length)
    setAnimatingVote(null)
  }, [filteredPrompts.length])

  const goRandom = useCallback(() => {
    if (filteredPrompts.length <= 1) return
    let next: number
    do {
      next = Math.floor(Math.random() * filteredPrompts.length)
    } while (next === currentIndex)
    setCurrentIndex(next)
    setAnimatingVote(null)
  }, [filteredPrompts.length, currentIndex])

  const handleFilterChange = useCallback((cat: Category | "all") => {
    setFilter(cat)
    setCurrentIndex(0)
    setAnimatingVote(null)
  }, [])

  // Compute percentages
  const totalVotes = currentVote ? currentVote.a + currentVote.b : 0
  const pctA = totalVotes > 0 ? Math.round((currentVote!.a / totalVotes) * 100) : 50
  const pctB = totalVotes > 0 ? 100 - pctA : 50

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_LABELS) as (Category | "all")[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Progress */}
        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {answeredCount} / {filteredPrompts.length} answered
        </span>

        {/* Random & Next */}
        <Button variant="outline" size="sm" onClick={goRandom} disabled={filteredPrompts.length <= 1}>
          <ShuffleIcon className="h-4 w-4 mr-1.5" />
          Random
        </Button>
        <Button variant="outline" size="sm" onClick={goNext} disabled={filteredPrompts.length === 0}>
          Next
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 overflow-y-auto">
        {!prompt ? (
          <p className="text-muted-foreground text-sm">No prompts in this category.</p>
        ) : (
          <>
            {/* Category badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[prompt.category]}`}>
              {CATEGORY_LABELS[prompt.category]}
            </span>

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-foreground text-center">
              Would you rather...
            </h2>

            {/* Cards + VS */}
            <div className="flex flex-col md:flex-row items-stretch gap-4 w-full max-w-3xl">
              {/* Option A */}
              <button
                onClick={() => castVote("a")}
                disabled={hasVoted}
                className={`flex-1 rounded-xl border-2 p-6 md:p-8 text-center transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center gap-3 ${
                  hasVoted && currentVote?.userVote === "a"
                    ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
                    : hasVoted
                      ? "border-border bg-muted/30 opacity-70"
                      : "border-border bg-card hover:border-blue-500/60 hover:bg-blue-500/5 cursor-pointer"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Option A</span>
                <span className="text-base md:text-lg font-semibold text-foreground leading-snug">
                  {prompt.optionA}
                </span>
                {hasVoted && (
                  <span className={`text-2xl font-bold tabular-nums transition-opacity duration-500 ${
                    animatingVote ? "opacity-0" : "opacity-100"
                  } text-blue-400`}>
                    {pctA}%
                  </span>
                )}
              </button>

              {/* VS badge */}
              <div className="flex items-center justify-center shrink-0">
                <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center">
                  <span className="text-xs font-black text-muted-foreground">VS</span>
                </div>
              </div>

              {/* Option B */}
              <button
                onClick={() => castVote("b")}
                disabled={hasVoted}
                className={`flex-1 rounded-xl border-2 p-6 md:p-8 text-center transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center gap-3 ${
                  hasVoted && currentVote?.userVote === "b"
                    ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30"
                    : hasVoted
                      ? "border-border bg-muted/30 opacity-70"
                      : "border-border bg-card hover:border-orange-500/60 hover:bg-orange-500/5 cursor-pointer"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Option B</span>
                <span className="text-base md:text-lg font-semibold text-foreground leading-snug">
                  {prompt.optionB}
                </span>
                {hasVoted && (
                  <span className={`text-2xl font-bold tabular-nums transition-opacity duration-500 ${
                    animatingVote ? "opacity-0" : "opacity-100"
                  } text-orange-400`}>
                    {pctB}%
                  </span>
                )}
              </button>
            </div>

            {/* Percentage bar */}
            {hasVoted && (
              <div className="w-full max-w-3xl flex flex-col gap-2">
                <div className="h-4 rounded-full overflow-hidden bg-muted flex">
                  <div
                    className="bg-blue-500 transition-all duration-700 ease-out rounded-l-full"
                    style={{ width: `${pctA}%` }}
                  />
                  <div
                    className="bg-orange-500 transition-all duration-700 ease-out rounded-r-full"
                    style={{ width: `${pctB}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>A: {currentVote!.a} vote{currentVote!.a !== 1 ? "s" : ""}</span>
                  <span>Total: {totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                  <span>B: {currentVote!.b} vote{currentVote!.b !== 1 ? "s" : ""}</span>
                </div>
              </div>
            )}

            {/* Prompt number */}
            <span className="text-xs text-muted-foreground tabular-nums">
              #{prompt.id} &middot; {currentIndex + 1} of {filteredPrompts.length}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
