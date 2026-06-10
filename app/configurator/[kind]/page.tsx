/**
 * Unified configurator route.
 *
 * Replaces the three near-identical static configurator pages
 * (n8n, chatkit, n8n-display) with one dynamic [kind] route. The kind param is
 * mapped to a widget kind + provider variant; unknown kinds 404.
 *
 *   /configurator/n8n          -> chat / n8n
 *   /configurator/chatkit      -> chat / chatkit
 *   /configurator/display      -> display
 *   /configurator/n8n-display  -> display (legacy alias; old links still work)
 */

import { notFound } from 'next/navigation';
import { ChatConfiguratorClient } from './chat-configurator-client';
import { DisplayConfiguratorClient } from './display-configurator-client';
import type { ConfiguratorVariant } from '@/hooks/use-configurator-page';

const KIND_MAP: Record<string, { kind: 'chat' | 'display'; variant: string }> = {
  n8n: { kind: 'chat', variant: 'n8n' },
  chatkit: { kind: 'chat', variant: 'chatkit' },
  display: { kind: 'display', variant: 'display' },
  // Legacy alias: keeps old /configurator/n8n-display links working without a redirect.
  'n8n-display': { kind: 'display', variant: 'display' },
};

export default async function ConfiguratorKindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  const mapped = KIND_MAP[kind];

  if (!mapped) {
    notFound();
  }

  if (mapped.kind === 'display') {
    return <DisplayConfiguratorClient />;
  }

  return <ChatConfiguratorClient variant={mapped.variant as ConfiguratorVariant} />;
}
