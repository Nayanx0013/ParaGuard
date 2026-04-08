import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlagiarismScore from "@/components/PlagiarismScore";

describe("PlagiarismScore", () => {
  it("renders sample-based safe-state copy", () => {
    render(<PlagiarismScore score={35} webScore={0} isChecking={false} />);

    expect(screen.getByText(/Live Internet Sample Check/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No strong matches found in sampled web search snippets/i)
    ).toBeInTheDocument();
  });

  it("renders loading state text", () => {
    render(<PlagiarismScore score={null} webScore={null} isChecking={true} />);

    expect(
      screen.getByText(/Scanning the live internet for exact matches/i)
    ).toBeInTheDocument();
  });
});
