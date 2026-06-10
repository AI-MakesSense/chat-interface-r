/**
 * Commit gate for the configurator's webhook URL inputs.
 *
 * The canonical webhookUrl validator rejects every partial URL ("h", "http",
 * "https:/"), and the widget store rejects invalid config updates WHOLESALE.
 * A fully-controlled input committing per keystroke would therefore wipe each
 * typed character — the field would only work via paste. Inputs buffer a
 * local draft and commit through this gate instead.
 *
 * Delegates to the canonical schema (empty string, or https:// / localhost
 * URL) so the gate can never drift from what the store accepts.
 *
 * NOTE: this module (like the sidebar's flat-key bridge) is scaffolding that
 * goes away with the config-sidebar rewrite.
 */
import { connectionSchema } from '@/lib/widget-config/schema';

const webhookUrlSchema = connectionSchema.shape.webhookUrl;

export function isCommittableWebhookUrl(value: string): boolean {
  return webhookUrlSchema.safeParse(value).success;
}
