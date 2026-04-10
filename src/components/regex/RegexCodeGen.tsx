"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const LANGUAGES = ["JavaScript", "Python", "Go", "Dart"] as const
type Language = typeof LANGUAGES[number]

const STORAGE_KEY_LANG = "kutu-regex-codegen-lang"

function escapeForString(pattern: string, quote: string): string {
    return pattern.replace(new RegExp(`[\\\\${quote}]`, "g"), "\\$&")
}

function generateSnippet(language: Language, pattern: string, flags: string, replacement: string | null): string {
    switch (language) {
        case "JavaScript": {
            const lines = [`const regex = /${pattern}/${flags};`, `const text = "your text here";`]
            if (replacement !== null) {
                lines.push(`const result = text.replace(regex, "${escapeForString(replacement, '"')}");`)
                lines.push(`console.log(result);`)
            } else if (flags.includes("g")) {
                lines.push(`const matches = text.matchAll(regex);`)
                lines.push(`for (const match of matches) {`)
                lines.push(`  console.log(match[0], match.index);`)
                lines.push(`}`)
            } else {
                lines.push(`const match = text.match(regex);`)
                lines.push(`if (match) {`)
                lines.push(`  console.log(match[0], match.index);`)
                lines.push(`}`)
            }
            return lines.join("\n")
        }
        case "Python": {
            const pyFlags: string[] = []
            if (flags.includes("i")) pyFlags.push("re.IGNORECASE")
            if (flags.includes("m")) pyFlags.push("re.MULTILINE")
            if (flags.includes("s")) pyFlags.push("re.DOTALL")
            const flagStr = pyFlags.length > 0 ? `, ${pyFlags.join(" | ")}` : ""
            const lines = [
                `import re`,
                ``,
                `pattern = re.compile(r"${escapeForString(pattern, '"')}"${flagStr})`,
                `text = "your text here"`,
            ]
            if (replacement !== null) {
                lines.push(`result = pattern.sub(r"${escapeForString(replacement, '"')}", text)`)
                lines.push(`print(result)`)
            } else if (flags.includes("g")) {
                lines.push(`matches = pattern.finditer(text)`)
                lines.push(`for match in matches:`)
                lines.push(`    print(match.group(), match.start())`)
            } else {
                lines.push(`match = pattern.search(text)`)
                lines.push(`if match:`)
                lines.push(`    print(match.group(), match.start())`)
            }
            return lines.join("\n")
        }
        case "Go": {
            const lines = [
                `package main`,
                ``,
                `import (`,
                `\t"fmt"`,
                `\t"regexp"`,
                `)`,
                ``,
                `func main() {`,
            ]
            const goPattern = flags.includes("i") ? `(?i)${pattern}` : pattern
            const finalPattern = flags.includes("s") ? `(?s)${goPattern}` : goPattern
            lines.push(`\tre := regexp.MustCompile(\`${finalPattern}\`)`)
            lines.push(`\ttext := "your text here"`)
            if (replacement !== null) {
                lines.push(`\tresult := re.ReplaceAllString(text, "${escapeForString(replacement, '"')}")`)
                lines.push(`\tfmt.Println(result)`)
            } else if (flags.includes("g")) {
                lines.push(`\tmatches := re.FindAllString(text, -1)`)
                lines.push(`\tfor _, m := range matches {`)
                lines.push(`\t\tfmt.Println(m)`)
                lines.push(`\t}`)
            } else {
                lines.push(`\tmatch := re.FindString(text)`)
                lines.push(`\tfmt.Println(match)`)
            }
            lines.push(`}`)
            return lines.join("\n")
        }
        case "Dart": {
            const dartFlags: string[] = []
            if (flags.includes("i")) dartFlags.push("caseSensitive: false")
            if (flags.includes("m")) dartFlags.push("multiLine: true")
            if (flags.includes("s")) dartFlags.push("dotAll: true")
            if (flags.includes("u")) dartFlags.push("unicode: true")
            const opts = dartFlags.length > 0 ? `, ${dartFlags.join(", ")}` : ""
            const lines = [
                `void main() {`,
                `  final regex = RegExp(r'${pattern}'${opts});`,
                `  const text = 'your text here';`,
            ]
            if (replacement !== null) {
                lines.push(`  final result = text.replaceAll(regex, '${replacement}');`)
                lines.push(`  print(result);`)
            } else if (flags.includes("g")) {
                lines.push(`  final matches = regex.allMatches(text);`)
                lines.push(`  for (final match in matches) {`)
                lines.push(`    print('\${match.group(0)} at \${match.start}');`)
                lines.push(`  }`)
            } else {
                lines.push(`  final match = regex.firstMatch(text);`)
                lines.push(`  if (match != null) {`)
                lines.push(`    print('\${match.group(0)} at \${match.start}');`)
                lines.push(`  }`)
            }
            lines.push(`}`)
            return lines.join("\n")
        }
    }
}

interface RegexCodeGenProps {
    pattern: string
    flags: string
    replacement: string | null
}

export function RegexCodeGen({ pattern, flags, replacement }: RegexCodeGenProps) {
    const [copiedLang, setCopiedLang] = useState<Language | null>(null)
    const [activeLang, setActiveLang] = useState<Language>(() => {
        if (typeof window === "undefined") return "JavaScript"
        return (localStorage.getItem(STORAGE_KEY_LANG) as Language) || "JavaScript"
    })

    if (!pattern) {
        return (
            <div className="p-4 text-xs text-muted-foreground text-center">
                Enter a pattern to generate code snippets
            </div>
        )
    }

    const handleCopy = async (lang: Language) => {
        const snippet = generateSnippet(lang, pattern, flags, replacement)
        await navigator.clipboard.writeText(snippet)
        setCopiedLang(lang)
        setTimeout(() => setCopiedLang(null), 2000)
    }

    const handleTabChange = (value: string) => {
        const lang = value as Language
        setActiveLang(lang)
        try {
            localStorage.setItem(STORAGE_KEY_LANG, lang)
        } catch {
            // storage unavailable
        }
    }

    return (
        <Tabs value={activeLang} onValueChange={handleTabChange} className="h-full flex flex-col">
            <TabsList className="mx-3 mt-2 shrink-0">
                {LANGUAGES.map(lang => (
                    <TabsTrigger key={lang} value={lang} className="text-xs">
                        {lang}
                    </TabsTrigger>
                ))}
            </TabsList>
            {LANGUAGES.map(lang => (
                <TabsContent key={lang} value={lang} className="flex-1 min-h-0 px-3 pb-3">
                    <div className="relative h-full">
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => handleCopy(lang)}
                            title={`Copy ${lang} snippet`}
                        >
                            {copiedLang === lang
                                ? <CheckIcon className="h-3 w-3" />
                                : <CopyIcon className="h-3 w-3" />}
                        </Button>
                        <pre className="h-full overflow-auto rounded-md bg-muted/30 border border-border p-3 pr-10 text-xs font-mono text-foreground leading-relaxed">
                            {generateSnippet(lang, pattern, flags, replacement)}
                        </pre>
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    )
}
