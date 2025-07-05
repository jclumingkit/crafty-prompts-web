import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base">
            We&apos;ve sent a confirmation link to your email address. Please
            click the link to verify your account and complete your
            registration.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">What&apos;s next?</p>
              <ul className="space-y-1 pl-4">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Check your email inbox (and spam folder)
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Click the confirmation link in the email
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  You will be redirected to your dashboard after confirmation
                </li>
              </ul>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to login</Link>
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Having trouble? Contact our{" "}
              <a
                href={`mailto:support@craftyprompts.com`}
                className="text-primary hover:underline"
              >
                support team
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
