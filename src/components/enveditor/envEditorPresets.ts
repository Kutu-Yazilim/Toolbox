import { type Preset } from "@/components/shared/PresetsDrawer"

export const ENV_EDITOR_PRESETS: Preset[] = [
    {
        name: "Node.js App",
        category: "Frameworks",
        description: "Common Node.js environment variables",
        content: `NODE_ENV=development\nPORT=3000\nHOST=localhost\nDATABASE_URL=postgresql://user:password@localhost:5432/mydb\nREDIS_URL=redis://localhost:6379\nJWT_SECRET=your-secret-key\nLOG_LEVEL=debug`,
    },
    {
        name: "Next.js App",
        category: "Frameworks",
        description: "Next.js environment variables",
        content: `NEXT_PUBLIC_APP_URL=http://localhost:3000\nNEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET=your-secret\nDATABASE_URL=postgresql://user:password@localhost:5432/mydb\nNEXT_PUBLIC_API_URL=http://localhost:3000/api`,
    },
    {
        name: "Docker Compose",
        category: "Infrastructure",
        description: "Common Docker environment variables",
        content: `POSTGRES_USER=admin\nPOSTGRES_PASSWORD=secretpassword\nPOSTGRES_DB=appdb\nREDIS_PASSWORD=redispass\nNGINX_PORT=80`,
    },
    {
        name: "AWS Config",
        category: "Cloud",
        description: "AWS SDK environment variables",
        content: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\nAWS_DEFAULT_REGION=us-east-1\nAWS_S3_BUCKET=my-bucket-name`,
    },
]
