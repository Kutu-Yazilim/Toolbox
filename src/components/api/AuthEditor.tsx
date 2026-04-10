"use client"

import { type AuthConfig, AUTH_TYPES } from "./apiTypes"

interface AuthEditorProps {
    auth: AuthConfig
    onChange: (auth: AuthConfig) => void
}

const labelClass = "text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12 flex-shrink-0"
const inputClass = "flex-1 h-6 px-2 text-xs font-mono bg-muted border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
const selectClass = "flex-1 h-6 px-2 text-xs font-mono bg-muted border border-border rounded outline-none focus:border-ring text-foreground"

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
    const updateType = (value: string) => {
        onChange({ ...auth, type: value as AuthConfig["type"] })
    }

    const updateBearer = (token: string) => {
        onChange({ ...auth, bearer: { token } })
    }

    const updateBasic = (field: "username" | "password", value: string) => {
        onChange({ ...auth, basic: { ...auth.basic, [field]: value } })
    }

    const updateApiKey = (field: keyof AuthConfig["apiKey"], value: string) => {
        onChange({ ...auth, apiKey: { ...auth.apiKey, [field]: value } })
    }

    return (
        <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center gap-2">
                <span className={labelClass}>Type</span>
                <select
                    value={auth.type}
                    onChange={e => updateType(e.target.value)}
                    className={selectClass}
                >
                    {AUTH_TYPES.map(t => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>

            {auth.type === "none" && (
                <p className="text-[11px] text-muted-foreground px-0.5">
                    No authentication configured.
                </p>
            )}

            {auth.type === "bearer" && (
                <div className="flex items-center gap-2">
                    <span className={labelClass}>Token</span>
                    <input
                        type="text"
                        value={auth.bearer.token}
                        onChange={e => updateBearer(e.target.value)}
                        placeholder="{{token}}"
                        className={inputClass}
                        spellCheck={false}
                    />
                </div>
            )}

            {auth.type === "basic" && (
                <>
                    <div className="flex items-center gap-2">
                        <span className={labelClass}>User</span>
                        <input
                            type="text"
                            value={auth.basic.username}
                            onChange={e => updateBasic("username", e.target.value)}
                            placeholder="Username"
                            className={inputClass}
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={labelClass}>Pass</span>
                        <input
                            type="password"
                            value={auth.basic.password}
                            onChange={e => updateBasic("password", e.target.value)}
                            placeholder="Password"
                            className={inputClass}
                        />
                    </div>
                </>
            )}

            {auth.type === "api-key" && (
                <>
                    <div className="flex items-center gap-2">
                        <span className={labelClass}>Key</span>
                        <input
                            type="text"
                            value={auth.apiKey.key}
                            onChange={e => updateApiKey("key", e.target.value)}
                            placeholder="Key name"
                            className={inputClass}
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={labelClass}>Value</span>
                        <input
                            type="text"
                            value={auth.apiKey.value}
                            onChange={e => updateApiKey("value", e.target.value)}
                            placeholder="{{api_key}}"
                            className={inputClass}
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={labelClass}>Add to</span>
                        <select
                            value={auth.apiKey.addTo}
                            onChange={e => updateApiKey("addTo", e.target.value)}
                            className={selectClass}
                        >
                            <option value="header">Header</option>
                            <option value="query">Query Param</option>
                        </select>
                    </div>
                </>
            )}
        </div>
    )
}
