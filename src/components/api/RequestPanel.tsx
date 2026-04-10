"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SendIcon, LoaderIcon } from "lucide-react"
import { type HttpMethod, type KeyValuePair, type BodyType, type AuthConfig, METHODS, METHOD_COLORS } from "./apiTypes"
import { HeadersEditor } from "./HeadersEditor"
import { QueryParamsEditor } from "./QueryParamsEditor"
import { BodyEditor } from "./BodyEditor"
import { AuthEditor } from "./AuthEditor"

interface RequestPanelProps {
    method: HttpMethod
    url: string
    headers: KeyValuePair[]
    queryParams: KeyValuePair[]
    bodyType: BodyType
    body: string
    formData: KeyValuePair[]
    urlEncodedData: KeyValuePair[]
    binaryFile: File | null
    auth: AuthConfig
    loading: boolean
    isDark: boolean
    onMethodChange: (method: HttpMethod) => void
    onUrlChange: (url: string) => void
    onHeadersChange: (headers: KeyValuePair[]) => void
    onQueryParamsChange: (params: KeyValuePair[]) => void
    onBodyTypeChange: (type: BodyType) => void
    onBodyChange: (body: string) => void
    onFormDataChange: (data: KeyValuePair[]) => void
    onUrlEncodedChange: (data: KeyValuePair[]) => void
    onBinaryFileChange: (file: File | null) => void
    onAuthChange: (auth: AuthConfig) => void
    onSend: () => void
}

export function RequestPanel({
    method,
    url,
    headers,
    queryParams,
    bodyType,
    body,
    formData,
    urlEncodedData,
    binaryFile,
    auth,
    loading,
    isDark,
    onMethodChange,
    onUrlChange,
    onHeadersChange,
    onQueryParamsChange,
    onBodyTypeChange,
    onBodyChange,
    onFormDataChange,
    onUrlEncodedChange,
    onBinaryFileChange,
    onAuthChange,
    onSend,
}: RequestPanelProps) {
    const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onSend()
    }

    return (
        <div className="flex flex-col min-h-0 h-1/2">
            {/* Request bar */}
            <div className="flex flex-wrap items-center gap-1 py-1.5 px-2 border-b border-border flex-shrink-0">
                {METHODS.map((m, i) => (
                    <>
                        {i > 0 && (
                            <div key={`divider-${m}`} className="w-px h-4 bg-border mx-0.5" />
                        )}
                        <button
                            key={m}
                            onClick={() => onMethodChange(m)}
                            className={
                                `text-[10px] font-bold px-2 py-0.5 rounded transition-colors ` +
                                (method === m
                                    ? METHOD_COLORS[m]
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted")
                            }
                        >
                            {m}
                        </button>
                    </>
                ))}

                <div className="w-px h-4 bg-border mx-0.5" />

                <input
                    type="text"
                    value={url}
                    onChange={e => onUrlChange(e.target.value)}
                    onKeyDown={handleUrlKeyDown}
                    placeholder="https://api.example.com/endpoint"
                    className="flex-1 h-7 px-2 text-xs font-mono border border-border rounded bg-muted/30 outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                    spellCheck={false}
                />

                <div className="w-px h-4 bg-border mx-0.5" />

                <Button variant="default" size="xs" onClick={onSend} disabled={loading}>
                    {loading ? (
                        <LoaderIcon className="h-3 w-3 animate-spin" />
                    ) : (
                        <SendIcon className="h-3 w-3" />
                    )}
                    <span className="ml-1">{loading ? "Sending" : "Send"}</span>
                </Button>
            </div>

            {/* Tabbed editor */}
            <Tabs defaultValue="params" className="flex flex-col flex-1 min-h-0">
                <TabsList variant="line" className="h-8 px-3 flex-shrink-0">
                    <TabsTrigger value="params" className="text-[11px]">Params</TabsTrigger>
                    <TabsTrigger value="headers" className="text-[11px]">Headers</TabsTrigger>
                    <TabsTrigger value="body" className="text-[11px]">Body</TabsTrigger>
                    <TabsTrigger value="auth" className="text-[11px]">Auth</TabsTrigger>
                </TabsList>

                <TabsContent value="params" className="flex-1 min-h-0 overflow-auto mt-0">
                    <QueryParamsEditor params={queryParams} onChange={onQueryParamsChange} />
                </TabsContent>

                <TabsContent value="headers" className="flex-1 min-h-0 overflow-auto mt-0">
                    <HeadersEditor headers={headers} onChange={onHeadersChange} />
                </TabsContent>

                <TabsContent value="body" className="flex flex-col flex-1 min-h-0 mt-0">
                    <BodyEditor
                        bodyType={bodyType}
                        body={body}
                        formData={formData}
                        urlEncodedData={urlEncodedData}
                        binaryFile={binaryFile}
                        onBodyTypeChange={onBodyTypeChange}
                        onBodyChange={onBodyChange}
                        onFormDataChange={onFormDataChange}
                        onUrlEncodedChange={onUrlEncodedChange}
                        onBinaryFileChange={onBinaryFileChange}
                        isDark={isDark}
                        method={method}
                    />
                </TabsContent>

                <TabsContent value="auth" className="flex-1 min-h-0 overflow-auto mt-0">
                    <AuthEditor auth={auth} onChange={onAuthChange} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
