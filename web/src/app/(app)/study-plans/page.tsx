import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Study Plans — UniGo" };

export default function StudyPlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <Heading as="h1">Study Plans</Heading>

      <Card className="flex flex-col items-center justify-center py-16 gap-4">
        <span className="text-5xl">📚</span>
        <Heading as="h3">Coming Soon</Heading>
        <Text variant="secondary" size="sm" className="max-w-sm text-center">
          AI-generated study plans tailored to your target university
          requirements will be available here soon.
        </Text>
      </Card>
    </div>
  );
}
