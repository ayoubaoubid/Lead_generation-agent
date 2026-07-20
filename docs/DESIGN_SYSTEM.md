# Design system — Orbit Interface

## Intention

Orbit Interface est le langage visuel interne de la plateforme. Il doit rendre des
opérations denses lisibles et sûres sans reprendre l'esthétique d'un dashboard
générique. Sa personnalité repose sur une neutralité légèrement chaude, une encre
bleu-noir et un accent indigo précis. Les couleurs sémantiques ne servent jamais de
décoration.

La référence interactive est disponible sur `/design-system`. Elle contient des
données fictives strictement limitées à la démonstration des composants et ne
constitue pas une page métier.

## Fondations

### Palette et couleurs sémantiques

Les tokens sont définis dans `apps/web/src/app/globals.css` :

- `--canvas`, `--canvas-subtle` : arrière-plans de page ;
- `--surface`, `--surface-raised`, `--surface-inset` : niveaux de surface ;
- `--ink`, `--ink-secondary`, `--ink-tertiary` : hiérarchie de texte ;
- `--line`, `--line-strong` : séparations et contours ;
- `--brand`, `--brand-hover`, `--brand-soft`, `--brand-ink` : action et sélection ;
- `--success`, `--warning`, `--danger` et leurs variantes `-soft` : états métier ;
- `--focus` : focus clavier visible.

Le mode sombre est activé avec `data-theme="dark"` sur l'élément `html`. Il conserve
la hiérarchie et le sens des couleurs sans simplement inverser la palette.

### Typographie et densité

- pile principale : Inter Variable lorsque disponible, puis polices système ;
- pile monospace : SFMono/Consolas pour identifiants, valeurs et corrélations ;
- corps par défaut : 15 px ;
- composants : 11 à 14 px selon la densité ;
- titres : graisse 650–700 et espacement négatif mesuré ;
- hauteur de contrôle standard : 38–40 px, compacte : 32 px, confortable : 44 px.

### Espacement, grille et géométrie

- unité de rythme recommandée : 4 px ;
- espacements usuels : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 et 96 px ;
- grille de page : contenu fluide, largeur maximale contextuelle et gouttières de
  16 px sur mobile, 24–70 px sur écran large ;
- rayons : 7 px pour les contrôles, 11 px pour les menus, 16 px pour les cartes et
  22 px pour les modales ;
- les bordures structurent l'interface ; les ombres sont réservées aux surfaces
  superposées ou interactives.

## Interaction et mouvement

- tout élément interactif doit conserver un focus visible ;
- les actions principales utilisent `brand`, les actions destructives `danger` ;
- un état disabled réduit le contraste mais reste lisible ;
- un état loading conserve le libellé accessible et bloque la double activation ;
- les transitions ordinaires durent 120–180 ms ; les drawers peuvent atteindre
  220 ms ;
- `prefers-reduced-motion: reduce` neutralise les mouvements non essentiels ;
- aucune information ne doit dépendre uniquement de la couleur.

## Composants

Les composants partagés sont exportés depuis `@/components/ui`. Les contrôles
complexes s'appuient sur Radix Primitives pour les rôles ARIA, la gestion du focus et
la navigation clavier. Les composants restent sans logique métier et ne doivent pas
importer de feature, service, repository ou configuration serveur.

Composants disponibles : `Button`, `Input`, `Textarea`, `Select`, `Checkbox`,
`RadioGroup`, `Switch`, `Badge`, `Avatar`, `Tooltip`, `Dropdown`, `Dialog`, `Drawer`,
`Tabs`, `Card`, `Table`, `DataTable`, `Pagination`, `EmptyState`, `LoadingState`,
`ErrorState`, `Toast`, `FormField`, `PageHeader`, `MetricCard` et
`StatusIndicator`.

## Règles d'accessibilité

- fournir un libellé visible ou un `aria-label` à chaque contrôle ;
- relier les erreurs aux champs dans les formulaires métier ;
- conserver l'ordre DOM comme ordre de lecture et de tabulation ;
- ne pas supprimer les outlines sans remplacement conforme ;
- tester Tab, Maj+Tab, Entrée, Espace, flèches et Échap selon le composant ;
- vérifier les contrastes en modes clair et sombre ;
- vérifier les largeurs 320 px, 768 px et 1280 px ;
- utiliser les états `EmptyState`, `LoadingState` et `ErrorState` avec une explication
  et une prochaine action claire.
