/**
 * Returns Tailwind CSS utility classes for role badges based on semantic theme tokens.
 *
 * @param role - The role name (e.g. 'admin', 'clipteam', 'editor', 'uploader')
 * @param isSelected - Whether the badge is active/selected
 * @returns Tailwind CSS class string
 *
 * @example
 * ```ts
 * const classes = getRoleBadgeClasses('admin', true);
 * ```
 */
export const getRoleBadgeClasses = (role: string, isSelected: boolean = true): string => {
  switch (role.toLowerCase()) {
    case 'admin':
      return isSelected
        ? 'bg-primary/20 text-primary border border-primary/40'
        : 'bg-cc-card text-muted-foreground border border-border hover:border-border/80';
    case 'clipteam':
      return isSelected
        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
        : 'bg-cc-card text-muted-foreground border border-border hover:border-border/80';
    case 'editor':
      return isSelected
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
        : 'bg-cc-card text-muted-foreground border border-border hover:border-border/80';
    case 'uploader':
      return isSelected
        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
        : 'bg-cc-card text-muted-foreground border border-border hover:border-border/80';
    default:
      return isSelected
        ? 'bg-white/10 text-foreground border border-border'
        : 'bg-cc-card text-muted-foreground/60 border border-border hover:border-border/80';
  }
};
