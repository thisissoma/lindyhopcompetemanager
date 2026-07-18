import { AppShell } from '@/components/ui/app-shell';
import { LogoBanner } from '@/components/ui/logo-banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Tag } from '@/components/ui/tag';
import { BibChip } from '@/components/ui/bib-chip';
import { StatusPill } from '@/components/ui/status-pill';
import { FeeBreakdown } from '@/components/ui/fee-breakdown';

export default function UiDemo() {
  return (
    <AppShell>
      <LogoBanner title="스트릿린디파이터 2026" menu={[{ href: '#', label: '참가 신청', active: true }, { href: '#', label: '대회 안내' }]} />
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button>기본(오렌지)</Button>
          <Button variant="secondary">그린</Button>
          <Button variant="ghost">고스트</Button>
          <Button variant="danger">위험</Button>
        </div>
        <Card accent selected>
          <CardBody>선택된 카드 <Tag>M&amp;M</Tag> <BibChip number={102} /></CardBody>
        </Card>
        <div className="flex gap-2">
          <StatusPill kind="success">입금완료</StatusPill>
          <StatusPill kind="danger">금액불일치</StatusPill>
          <StatusPill kind="warning">입금대기</StatusPill>
        </div>
        <Field label="입금자명"><Input placeholder="홍길동" /></Field>
        <FeeBreakdown items={[{ label: '입장료', amount: 20000 }, { label: 'Open M&M', amount: 28000 }]} total={48000} />
      </div>
    </AppShell>
  );
}
