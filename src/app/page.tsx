// import WorkflowDemo from "~/components/workflow-demo";import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRightOutlined } from '@ant-design/icons';
import HeroSection from "./_components/hero-section";
import WorkflowBuilder from "~/components/workflow-builder";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b py-4 px-6 bg-background/80 backdrop-blur-sm fixed w-full z-50">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[#F7901D] to-black flex items-center justify-center text-white font-bold">
              F
            </div>
            <h1 className="text-xl font-bold">Flow Editor</h1>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </header>

      <div className="pt-16">
        <HeroSection />
      </div>
      <div className="relative z-10">
        <header className="border-b p-4 bg-background">
          <h1 className="text-2xl font-bold">Workflow Automation Builder</h1>
        </header>
        <WorkflowBuilder />
      </div>
    </main>
  );
}
