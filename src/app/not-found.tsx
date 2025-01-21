import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-bold">Not Found</h2>
      <p className="text-muted-foreground">
        Could not find the requested resource
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
