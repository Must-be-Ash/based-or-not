export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  return Response.json(
    {
      "accountAssociation": {
        "header": "eyJmaWQiOjI0MjQzNCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDhmMUJBYjZBNkM4MjAxZTc0OTFlQzM2QzcxMUQ4MThmMEQ1OGYzNkIifQ",
        "payload": "eyJkb21haW4iOiJ0aW1lZHJpZ2h0LnZlcmNlbC5hcHAifQ",
        "signature": "MHhkMzczY2U2ZDhiYWVjZTY1ODg5ZjZlZjgwZDk2MDUyMzk4YTc2NWI3NmQzMTYzYzZiNmRmZmU2YTBhMDFmYmFmNDYxN2E5MDgyNWRkYzM0ZjlkZGJhMWE1MGIyMzQxNjExZDI0ZjY2MzJmODE5MmVkMjhjZTY3MDZhNGU0YjkyZTFi"
      },
      "frame": {
        "version": "next",
        "name": "timed-right",
        "homeUrl": "https://timedright.vercel.app/",
        "iconUrl": "https://timedright.vercel.app//chad.png",
        "imageUrl": "https://timedright.vercel.app//chad.png",
        "buttonTitle": "Launch timed-right",
        "splashImageUrl": "https://timedright.vercel.app//chad.png",
        "splashBackgroundColor": "#FFFFFF",
        "webhookUrl": "https://timedright.vercel.app//api/webhook"
      },
    }
  );
}
