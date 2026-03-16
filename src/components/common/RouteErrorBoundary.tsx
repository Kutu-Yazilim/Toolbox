import { useRouteError, isRouteErrorResponse, Link } from "react-router"
import { AlertTriangleIcon, HomeIcon } from "lucide-react"

export function RouteErrorBoundary() {
  const error = useRouteError()

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong"

  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? "The page you're looking for doesn't exist."
      : error.data?.message ?? "An unexpected error occurred."
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred."

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <AlertTriangleIcon className="size-12 text-destructive" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <HomeIcon className="size-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
