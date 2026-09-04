import {
  markdownResponseHeaders,
} from "@/lib/agent/accept";
import { markdownForPath, notFoundMarkdown } from "@/lib/agent/markdown-content";

type RouteContext = { params: { slug?: string[] } };

function pathFromSlug(slug?: string[]): string {
  if (!slug || slug.length === 0) return "/";
  return `/${slug.join("/")}`;
}

export async function GET(_request: Request, context: RouteContext) {
  const pathname = pathFromSlug(context.params.slug);
  const body = markdownForPath(pathname);

  if (!body) {
    return new Response(notFoundMarkdown(pathname), {
      status: 404,
      headers: markdownResponseHeaders(),
    });
  }

  return new Response(body, {
    status: 200,
    headers: markdownResponseHeaders(),
  });
}
