export interface CooldownSource {
  member?: { id?: string; user?: { id: string } } | null;
  author?: { id: string } | null;
}
