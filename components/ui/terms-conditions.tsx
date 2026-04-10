"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TocDialog() {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const evaluateReadState = () => {
    const content = contentRef.current;
    if (!content) return;

    const maxScrollTop = content.scrollHeight - content.clientHeight;
    const reachedBottom = maxScrollTop <= 1 || content.scrollTop >= maxScrollTop - 8;
    if (reachedBottom) {
      setHasReadToBottom(true);
    }
  };

  // Re-evaluate every time dialog opens
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      evaluateReadState();
    }, 150); // slight delay to ensure DOM is ready
    return () => clearTimeout(timer);
  }, [open]);

  const handleScroll = () => {
    if (hasReadToBottom) return;
    evaluateReadState();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setHasReadToBottom(false); // reset on close
    }}>
      <DialogTrigger asChild>
        <Button variant="link" className="underline hover:no-underline px-1 py-0 h-auto">
          Terms & Conditions
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base">
            Terms & Conditions
          </DialogTitle>
        </DialogHeader>
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <DialogDescription asChild>
            <div className="px-6 py-4">
              <div className="[&_strong]:text-gray-900 dark:[&_strong]:text-gray-100 space-y-4 [&_strong]:font-semibold">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p><strong>Acceptance of Terms</strong></p>
                    <p>
                      By accessing and using this website, users agree to
                      comply with and be bound by these Terms of Service.
                      Users who do not agree with these terms should
                      discontinue use of the website immediately.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>User Account Responsibilities</strong></p>
                    <p>
                      Users are responsible for maintaining the
                      confidentiality of their account credentials. Any
                      activities occurring under a user&apos;s account are
                      the sole responsibility of the account holder. Users
                      must notify the website administrators immediately of
                      any unauthorized account access.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>Content Usage and Restrictions</strong></p>
                    <p>
                      The website and its original content are protected by
                      intellectual property laws. Users may not reproduce,
                      distribute, modify, create derivative works, or
                      commercially exploit any content without explicit
                      written permission from the website owners.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </div>
        <DialogFooter className="border-t px-6 py-4 sm:items-center">
          {!hasReadToBottom && (
            <span className="text-gray-500 grow text-xs max-sm:text-center">
              Scroll down to read all terms before accepting.
            </span>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" disabled={!hasReadToBottom}>
              I agree
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}