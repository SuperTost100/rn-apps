import { Card, HtmlView, Section, SectionHeader } from '@polito/lib/ui';
import { GuideSection } from '@polito/student-api-client';

type Props = {
  section: GuideSection;
};

/** One part of a guide: its title as a section header, the text in a card */
export const GuideSectionListItem = ({ section }: Props) => {
  return (
    <Section>
      <SectionHeader title={section.title} ellipsizeTitle={false} />
      <Card padded>
        <HtmlView
          props={{
            source: { html: section.content },
            baseStyle: { padding: 0 },
          }}
          variant="longProse"
        />
      </Card>
    </Section>
  );
};
