# Keel Web — project tree

Living map of every file under `keel_web/`. Update when files are added, removed, renamed, or materially change role.

Production React web frontend under `keel_web/`.

```
keel_web/
├── .gitignore  # Ignores .env, node_modules/, dist/, caches
├── index.html  # Document title: Keel
├── package-lock.json  # Locked npm dependency versions
├── package.json  # Vite + React + React Router + TanStack Query dependencies
├── postcss.config.js  # PostCSS + Tailwind pipeline
├── PROJECT_TREE.md  # This file — directory tree + per-file purpose
├── README.md  # Overview, env vars, quick start
├── src/
│   ├── app/
│   │   ├── nav/
│   │   │   ├── AppNav.tsx  # Unified resizable nav: icon rail, drag-reorder
│   │   │   ├── appNavConfig.ts  # Nav types, layout/width constants, path helpers
│   │   │   ├── appNavLayout.ts  # Nav layout entries (items + separators), reorder
│   │   │   ├── appNavLayoutDefaults.ts  # Default item slots and separator anchors
│   │   │   ├── appNavOrder.ts  # Legacy item-id order merge (migrated to layout)
│   │   │   ├── appNavRegistry.tsx  # Nav items derived from enabled module manifests
│   │   │   ├── appNavStorage.ts  # Persist nav panel { open, width } to localStorage
│   │   │   ├── navWaveGlow.ts  # Nav wave glow resolver + localStorage helpers
│   │   │   ├── moduleSubNavConfig.ts  # Module secondary nav types and path matching
│   │   │   ├── moduleSubNavStorage.ts  # Last-visited route per module sub-nav section
│   │   │   ├── ModuleSubNav.tsx  # Secondary tab nav UI for module sections
│   │   │   ├── components/          # nav UI components
│   │   │   │   └── AppNavSeparator.tsx  # Horizontal divider row in the nav list
│   │   │   ├── useAppNavLayout.ts  # Nav open/width state + drag-resize hook
│   │   │   ├── useAppNavOrder.ts  # Nav rows + localStorage cache + /settings sync
│   │   │   └── useNavWaveGlowEnabled.ts  # Hook for wave glow from cache/localStorage
│   │   ├── navigation/
│   │   │   ├── AppBreadcrumb.tsx  # Clickable trail UI + pinned shortcuts
│   │   │   ├── BreadcrumbContextMenu.tsx  # Right-click menu for breadcrumb actions
│   │   │   ├── breadcrumbPins.ts  # Pinned breadcrumb localStorage helpers
│   │   │   ├── breadcrumbMaxEntries.ts  # Breadcrumb max bounds + resolver + storage
│   │   │   ├── prefetchPinnedNavigationLabels.ts  # Prefetch record data for pinned paths
│   │   │   ├── resolveNavigationNavIcon.ts  # Nav menu icon id for a breadcrumb path
│   │   │   ├── resolvePinnedNavigationLabel.ts  # Pinned label with stored fallback
│   │   │   ├── useNavigationBreadcrumbMaxEntries.ts  # Hook for max from cache/localStorage
│   │   │   ├── useNavigationBreadcrumbPins.ts  # Hook for pin/unpin state
│   │   │   ├── usePrefetchPinnedNavigationLabels.ts  # Prefetch hook for pinned labels
│   │   │   ├── navigationStackConfig.ts  # Page keys; default stack size re-export
│   │   │   ├── NavigationStackContext.tsx  # Stack provider, navigate/restore
│   │   │   ├── navigationStackTypes.ts  # Stack entry + handler types
│   │   │   ├── resolveNavigationLabel.ts  # Breadcrumb label from route
│   │   │   ├── useBreadcrumbLabelRefresh.ts  # Refresh breadcrumb labels when cache updates
│   │   │   └── usePageNavigationState.ts  # Per-page capture/restore hook
│   │   ├── modules/
│   │   │   ├── buildHomeCardRegistry.ts  # Merge homeCards from enabled manifests
│   │   │   ├── buildSettingsTabRegistry.ts  # Merge settingsTabs from enabled manifests
│   │   │   ├── homeCardTypes.ts  # HomeCardDefinition, HomeCardId, HOME_CARD_IDS
│   │   │   ├── registry.ts  # Ordered module manifest imports + enabledModules helper
│   │   │   ├── settingsTabTypes.ts  # SettingsTabDefinition + SettingsTabPanelProps
│   │   │   └── types.ts  # FeatureModuleManifest type
│   │   ├── providers.tsx  # QueryClient + theme/transition contexts + AppThemeEffects
│   │   ├── routes.tsx  # App route manifest; loops enabled module manifests
│   │   └── shell/
│   │       ├── AnimatedOutlet.tsx  # Framer Motion shell page transitions
│   │       ├── AppHeader.tsx  # Global top bar (breadcrumb host)
│   │       ├── AppShell.tsx  # Shared layout: nav, header, AnimatedOutlet
│   │       ├── AppThemeEffects.tsx  # Dynamic theme overlays (rainy night rain)
│   │       ├── AppShellWallpaper.tsx  # Optional user wallpaper behind content column
│   │       ├── AppShellContent.tsx  # Standard main-content padding wrapper
│   │       ├── GlobalMediaPasteUpload.tsx  # App-wide paste-to-media confirmation dialog
│   │       ├── globalMediaPasteRoutes.ts  # Route exclusions and folder context for global paste
│   │       └── ModuleSubNavLayout.tsx  # Module layout with secondary tabs + outlet
│   ├── assets/
│   │   ├── general/
│   │   │   ├── google.png  # Image asset
│   │   │   └── keel.png  # Image asset
│   │   ├── KeelPersona/
│   │   │   ├── beret.png  # Persona beret accessory (production playback)
│   │   │   ├── branch.png  # Persona branch prop (production playback)
│   │   │   ├── cake.png  # Persona cake accessory (production playback)
│   │   │   ├── chef-hat.png  # Persona chef hat accessory (production playback)
│   │   │   ├── helm.png  # Persona helm wheel prop (production playback)
│   │   │   ├── nose w_ mustache.png  # Persona disguise nose accessory (production playback)
│   │   │   ├── pirate_hat.png  # Persona pirate hat accessory (production playback)
│   │   │   ├── sailor-hat.png  # Persona sailor hat accessory (production playback)
│   │   │   ├── telescope.png  # Persona corner telescope prop (production playback)
│   │   │   └── water-droplet.png  # Persona rain droplet image (production playback)
│   │   ├── intelligence/
│   │   │   ├── models.png  # Image asset
│   │   │   ├── README.md  # Intelligence hub icon assets
│   │   │   └── tools.png  # Image asset
│   │   └── nav_icons/
│   │       └── dev.png  # Dev sandbox nav icon (dev-only module)
│   ├── components/          # src UI components
│   │   ├── buttons/
│   │   │   └── IconPlusButton.tsx  # Compact sky plus button for list-page create actions
│   │   ├── CardMenu.tsx  # Top-right three-dot card menu (portaled)
│   │   ├── keelPersona/          # Keel persona platform UI
│   │   │   ├── README.md
│   │   │   ├── INTEGRATION.md    # Wiring animations into feature modules
│   │   │   ├── KeelPersonaPlayer.tsx
│   │   │   ├── KeelPersonaRainOverlay.tsx  # Falling water-droplet rain for sailor clip
│   │   │   ├── KeelAnimationComposer.tsx
│   │   │   ├── KeelPersonaRenderer.tsx
│   │   │   ├── playbackHandlers.ts
│   │   │   ├── KeelCaptionBubble.tsx
│   │   │   ├── elements/         # Playback element views (dot, polygon, line, media, glass)
│   │   │   ├── loadingIcon/      # Base PNG + wobble layer
│   │   │   └── index.ts
│   │   ├── InlineSaveDiscardActions.tsx  # Slide-in Save/Discard header actions
│   │   ├── ListSearch.tsx  # Real-time list filter input
│   │   ├── MediaCardMenu.tsx  # Media thumbnail actions menu (view, set cover)
│   │   ├── MediaLightbox.tsx  # Full-screen media preview + MediaTrashButton
│   │   ├── ModuleTabBar.tsx  # Horizontal tab bar for module detail pages
│   │   ├── ToggleSwitch.tsx  # Accessible on/off toggle control
│   │   ├── links/
│   │   │   └── ExternalLinkButton.tsx  # Opens external URLs in new tab
│   │   ├── panels/
│   │   │   ├── index.ts  # Panel grip/handle exports
│   │   │   ├── PanelRepositionGrip.tsx  # Drag grip to reposition floating panels
│   │   │   └── PanelResizeHandle.tsx  # Edge grip to resize panels
│   │   └── select/
│   │       └── SearchableSelect.tsx  # Filterable dropdown select
│   ├── hooks/          # Shared React hooks (cross-module)
│   │   ├── useConfirmDeleteAction.ts  # Two-step delete confirm with timeout
│   │   ├── usePageFileDrop.ts  # Window-level file drag-and-drop for detail pages
│   │   ├── useRecordNotFoundRedirect.ts  # Redirect when detail record 404s
│   │   ├── useRouteNotice.ts  # Route-level flash notice from navigation state
│   │   └── keelPersona/          # Keel persona clip playback hooks (motion is CSS/WAAPI)
│   │       ├── README.md
│   │       ├── index.ts
│   │       ├── useKeelAnimationPlayer.ts  # Step-based clip player
│   │       ├── useKeelClipMediaReady.ts  # Clip media preload gate
│   │       └── useRandomKeelClip.ts  # Random clip id for loading overlays
│   ├── views/          # Shared list/form/card view templates
│   │   ├── README.md  # Template catalog and extension points
│   │   ├── index.ts  # Public exports
│   │   ├── cards/
│   │   │   ├── CardGalleryPageLayout.tsx  # Focus + Coak card gallery page shell
│   │   │   └── cardGridClasses.ts  # Shared responsive card grid tokens
│   │   ├── form/
│   │   │   └── FormPageLayout.tsx  # Unified create/edit form chrome
│   │   └── list/
│   │       ├── ListPageLayout.tsx  # List page header (title, count, actions)
│   │       ├── ListPaginationBar.tsx  # Pagination bar UI (avoids listPagination.ts case clash)
│   │       ├── ListView.tsx  # Sortable paginated table shell
│   │       ├── TagsListView.tsx  # Tag manager table template
│   │       ├── listPagination.ts  # Pagination + sort state helpers
│   │       ├── types.ts  # ListView column and props types
│   │       ├── useListViewState.ts  # Combined sort + pagination hook
│   │       └── primitives/
│   │           ├── ListDragHandle.tsx  # Six-dot grip for list reorder
│   │           ├── ListInsertIndicator.tsx  # Lime drop-target line
│   │           ├── ListPageTitle.tsx  # Page heading with record count
│   │           ├── ListSortableHeaderCell.tsx  # Sortable column header with arrow
│   │           └── listColumnSort.ts  # useListColumnSort hook
│   ├── index.css  # Tailwind directives
│   ├── lib/          # src helpers
│   │   ├── api.ts  # getApiBaseUrl, apiFetch, ApiError
│   │   ├── keelPersona/          # Clip/caption registry + playback data
│   │   │   ├── README.md
│   │   │   ├── types.ts
│   │   │   ├── applyLook.ts
│   │   │   ├── happyEyeMorph.ts  # Gaze/straight eye dot classifiers (morph timing lives in CSS)
│   │   │   ├── motionPlayback.ts  # Per-step motion descriptors + WAAPI hop keyframes
│   │   │   ├── eyeScale.ts  # Straight-gaze eye scale multiplier resolver
│   │   │   ├── mediaAssets.ts
│   │   │   ├── preloadKeelPersonaMedia.ts
│   │   │   ├── promotedDesign.json
│   │   │   ├── promotedDesign.ts
│   │   │   ├── captionBank.ts
│   │   │   ├── clipRegistry.ts
│   │   │   ├── loadingTimeline.ts  # WAAPI compositor timeline compiler
│   │   │   ├── keelPersonaRainDroplets.ts  # Randomized rain field for sailor overlay
│   │   │   ├── resolveCaption.ts
│   │   │   ├── elements/
│   │   │   │   └── baseDesign.ts
│   │   │   ├── geometry/         # Loading icon layout + wobble (playback)
│   │   │   ├── clips/
│   │   │   │   ├── index.ts
│   │   │   │   ├── bakingCake.ts
│   │   │   │   ├── impatience.ts
│   │   │   │   ├── suspiciousDisguise.ts
│   │   │   │   ├── telescopeBooty.ts
│   │   │   │   └── theSailor.ts
│   │   │   ├── captions/
│   │   │   │   ├── index.ts
│   │   │   │   ├── baking.ts
│   │   │   │   ├── disguise.ts
│   │   │   │   ├── loading.ts
│   │   │   │   ├── pirate.ts
│   │   │   │   └── sailor.ts
│   │   │   └── index.ts
│   │   ├── listReorder.ts  # Shared drag-reorder helpers (nav + lists)
│   │   ├── sse.ts  # SSE chat stream helpers
│   │   ├── visual/          # Shared visual effects
│   │   │   ├── lightningStrike.ts  # Lightning strike type, bolt paths, factory
│   │   │   ├── rainDroplets.ts  # Randomized rain droplet field generator
│   │   │   ├── RainyNightRainOverlay.tsx  # Layered falling rain overlay component
│   │   │   ├── useLightningStrikes.ts  # Hook: intermittent random lightning strikes
│   │   │   └── usePrefersReducedMotion.ts  # Hook: OS reduced-motion preference
│   │   └── stl-viewer/          # Shared Three.js STL viewer
│   │       ├── index.ts  # STL viewer public exports
│   │       ├── stlViewerRuntime.ts  # Three.js STL viewer runtime
│   │       ├── useStlFile.ts  # Hook: load STL blob into viewer
│   │       ├── viewerAppearanceConfig.ts  # Viewer color/brightness defaults
│   │       └── webglSupport.ts  # WebGL capability probe
│   ├── main.tsx  # React entry; AppProviders + BrowserRouter
│   ├── modules/
│   │   ├── agents/
│   │   │   ├── api.ts  # GET/PATCH /agents catalog, system-prompt, context-usage
│   │   │   ├── components/          # agents UI components
│   │   │   │   ├── AgentDetailAside.tsx  # Agent Detail Aside
│   │   │   │   ├── AgentDetailPanel.tsx  # Agent Detail Panel
│   │   │   │   ├── AgentEditorActions.tsx  # Agent Editor Actions
│   │   │   │   ├── AgentModelSettings.tsx  # Agent Model Settings
│   │   │   │   ├── AgentModelViewer.tsx  # Agent Model Viewer
│   │   │   │   ├── AgentsCatalog.tsx  # Agents Catalog
│   │   │   │   ├── AgentSectionHeader.tsx  # Agent Section Header
│   │   │   │   ├── AgentStartChatButton.tsx  # Agent Start Chat Button
│   │   │   │   ├── AgentToolCategoryEditor.tsx  # Agent Tool Category Editor
│   │   │   │   ├── EditableText.tsx  # Editable Text
│   │   │   │   ├── KeelOrchestratorCard.tsx  # Keel Orchestrator Card
│   │   │   │   ├── SubAgentTile.tsx  # Sub Agent Tile
│   │   │   │   └── TokenCountBadge.tsx  # Token Count Badge
│   │   │   ├── context/          # agents React context
│   │   │   │   └── AgentEditorContext.tsx  # Agent Editor Context
│   │   │   ├── hooks/          # agents hooks
│   │   │   │   ├── useAgentContextUsage.ts  # use Agent Context Usage
│   │   │   │   └── useAgentEditor.ts  # use Agent Editor
│   │   │   ├── lib/          # agents helpers
│   │   │   │   ├── agentDisplay.ts  # agent Display
│   │   │   │   └── index.ts  # index
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── pages/          # agents pages
│   │   │   │   └── AgentsPage.tsx  # Agents Page
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── auth/
│   │   │   ├── api.ts  # auth API client
│   │   │   ├── lib/          # auth helpers
│   │   │   │   ├── loginConfig.ts  # ACTIVE_LOGIN_VARIANT global switch
│   │   │   │   └── loginScatterPlacement.ts  # scatter login placement helpers
│   │   │   ├── components/          # auth UI components
│   │   │   │   ├── EnterButton.tsx  # Showcase Enter login button
│   │   │   │   ├── login/          # login variant-specific UI
│   │   │   │   │   ├── classic/
│   │   │   │   │   │   └── LoginLightningSky.tsx  # classic login lightning sky
│   │   │   │   │   └── scatter/
│   │   │   │   │       ├── LoginScatterAmbience.tsx  # scatter login ambience orchestrator
│   │   │   │   │       ├── LoginScatterClipDescriptor.tsx  # scatter clip name + quip panel
│   │   │   │   │       └── LoginScatterSpot.tsx  # scatter login persona spot
│   │   │   │   ├── ProfileMenu.tsx  # Profile Menu
│   │   │   │   ├── RedirectIfAuthed.tsx  # Redirect If Authed
│   │   │   │   ├── RequireAuth.tsx  # Require Auth
│   │   │   │   └── UserAvatar.tsx  # User Avatar
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── pages/          # auth pages
│   │   │   │   ├── LoginPage.tsx  # login variant dispatcher
│   │   │   │   └── login/          # login screen variants
│   │   │   │       ├── ClassicLoginScreen.tsx  # classic login screen
│   │   │   │       ├── EmberLoginScreen.tsx  # ember login screen
│   │   │   │       ├── GrayLoginScreen.tsx  # gray login screen
│   │   │   │       ├── ScatterLoginScreen.tsx  # scatter login screen
│   │   │   │       └── registry.ts  # login variant registry
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── catalog/          # Committed catalog media (agents, providers, tool categories)
│   │   │   ├── api.ts  # Catalog read API (modalities, providers, models, tools)
│   │   │   └── lib/          # catalog helpers
│   │   │       └── providerDisplay.ts  # Provider labels + logo URLs from catalog media
│   │   ├── chat/
│   │   │   ├── api.ts  # chat API client
│   │   │   ├── components/          # chat UI components
│   │   │   │   ├── common/
│   │   │   │   │   ├── AgentAvatar.tsx  # Agent Avatar
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   └── SwitchToggle.tsx  # Switch Toggle
│   │   │   │   ├── composer/
│   │   │   │   │   ├── ChatComposer.tsx  # Chat Composer
│   │   │   │   │   └── index.ts  # index
│   │   │   │   ├── conversation/
│   │   │   │   │   ├── ConversationDragHandle.tsx  # Conversation Drag Handle
│   │   │   │   │   ├── ConversationInsertIndicator.tsx  # Conversation Insert Indicator
│   │   │   │   │   ├── ConversationList.tsx  # Conversation List
│   │   │   │   │   ├── ConversationRowMenu.tsx  # Conversation Row Menu
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   └── NewConversationAgentPicker.tsx  # New Conversation Agent Picker
│   │   │   │   ├── message/
│   │   │   │   │   ├── ChatConversationEmptyState.tsx  # Chat Conversation Empty State
│   │   │   │   │   ├── CopyableCodeBlock.tsx  # Copyable Code Block
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── KeelStructuredCodeBlock.tsx  # Keel Structured Code Block
│   │   │   │   │   ├── MessageBubbleCopyButton.tsx  # Message Bubble Copy Button
│   │   │   │   │   ├── MessageList.tsx  # Message List
│   │   │   │   │   ├── MessageMarkdown.tsx  # Message Markdown
│   │   │   │   │   ├── MessageMetadata.tsx  # Message Metadata
│   │   │   │   │   ├── ProposalCard.tsx  # Proposal Card
│   │   │   │   │   ├── RecordCard.tsx  # Record Card
│   │   │   │   │   └── TypingDots.tsx  # Typing Dots
│   │   │   │   ├── model/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ModelSelect.tsx  # Model Select
│   │   │   │   │   └── ModelSettingsPanel.tsx  # Model Settings Panel
│   │   │   │   └── status/
│   │   │   │       ├── ContextUsageDial.tsx  # Context Usage Dial
│   │   │   │       ├── GeneralTab.tsx  # General Tab
│   │   │   │       ├── GeneralTabSection.tsx  # General Tab Section
│   │   │   │       ├── index.ts  # index
│   │   │   │       ├── logEntryIcons.tsx  # log Entry Icons
│   │   │   │       ├── LogTab.tsx  # Log Tab
│   │   │   │       ├── RulesTab.tsx  # Rules Tab
│   │   │   │       ├── StatusPanel.tsx  # Status Panel
│   │   │   │       └── ToolCategoryIcon.tsx  # Tool Category Icon
│   │   │   ├── hooks/          # chat hooks
│   │   │   │   ├── useChatStream.ts  # use Chat Stream
│   │   │   │   ├── useStatusLog.ts  # use Status Log
│   │   │   │   ├── useStatusPanelLayout.ts  # use Status Panel Layout
│   │   │   │   └── useStatusPanelTabLayout.ts  # use Status Panel Tab Layout
│   │   │   ├── lib/          # chat helpers
│   │   │   │   ├── conversationReorder.ts  # conversation Reorder
│   │   │   │   ├── keelBlocks.ts  # keel Blocks
│   │   │   │   ├── message/
│   │   │   │   │   ├── conversationTokenEstimate.ts  # conversation Token Estimate
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   └── messageMetadataUtils.ts  # message Metadata Utils
│   │   │   │   ├── model/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   └── modelDisplayUtils.ts  # model Display Utils
│   │   │   │   ├── status/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── statusPanelConfig.ts  # status Panel Config
│   │   │   │   │   ├── statusPanelDrag.ts  # status Panel Drag
│   │   │   │   │   ├── statusPanelRegistry.tsx  # status Panel Registry
│   │   │   │   │   ├── statusPanelStorage.ts  # status Panel Storage
│   │   │   │   │   ├── statusPanelTabContent.tsx  # status Panel Tab Content
│   │   │   │   │   ├── statusPanelTabLayout.ts  # status Panel Tab Layout
│   │   │   │   │   └── statusPanelTabLayoutStorage.ts  # status Panel Tab Layout Storage
│   │   │   │   └── tools/
│   │   │   │       ├── index.ts  # index
│   │   │   │       └── toolCategoryDisplay.ts  # tool Category Display
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── pages/          # chat pages
│   │   │   │   └── ChatPage.tsx  # Chat Page
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── coak/          # C.O.A.K. — Culmination of All Knowledge
│   │   │   ├── api/          # Coak API client
│   │   │   │   ├── types.ts  # Shared Coak types
│   │   │   │   ├── queryKeys.ts  # React Query keys
│   │   │   │   ├── records.ts  # Record CRUD
│   │   │   │   ├── items.ts  # Directory item CRUD
│   │   │   │   ├── tags.ts  # Record tag CRUD
│   │   │   │   ├── workspace.ts  # Workspace state/settings
│   │   │   │   └── index.ts  # Barrel re-export
│   │   │   ├── components/          # coak UI components
│   │   │   │   ├── cards/
│   │   │   │   │   └── CoakRecordCard.tsx  # Focus-style record hub card
│   │   │   │   ├── panels/          # Shared workspace window chrome
│   │   │   │   │   ├── CoakDraggablePanel.tsx  # Shared draggable window shell
│   │   │   │   │   ├── CoakPanelResizeHandles.tsx  # Edge/corner resize affordances
│   │   │   │   │   ├── CoakWorkspaceWindows.tsx  # Renders all workspace windows from layout state
│   │   │   │   │   ├── CoakWorkspaceWindow.tsx  # Single tabbed/resizable workspace window
│   │   │   │   │   ├── CoakWorkspaceTabBar.tsx  # Draggable tab bar with reorder and dock
│   │   │   │   │   ├── CoakWorkspaceTabContent.tsx  # Tab body router (Constellation, Directory, etc.)
│   │   │   │   │   ├── CoakWorkspaceTabDragPreview.tsx  # Floating tab ghost while dragging
│   │   │   │   │   └── CoakWorkspaceTabIcons.tsx  # Tab header icons
│   │   │   │   ├── shared/
│   │   │   │   │   └── CoakItemFileMenu.tsx  # Three-dot file attach/update/delete menu for items
│   │   │   │   ├── tags/
│   │   │   │   │   ├── CoakTagPill.tsx  # Display-only colored tag pill
│   │   │   │   │   ├── CoakItemInlineTags.tsx  # Inline add/remove tag picker for items
│   │   │   │   │   ├── CoakTagListRow.tsx  # Tags tab list row with color/name/description/nodes/delete
│   │   │   │   │   └── CoakTagsListView.tsx  # Tags tab table with pagination
│   │   │   │   ├── search/
│   │   │   │   │   └── CoakNodeSearchInput.tsx  # Shared pill-shaped node search field
│   │   │   │   └── tabs/          # One folder per workspace tab
│   │   │   │       ├── constellation/
│   │   │   │       │   ├── index.ts  # Tab entry barrel (CoakConstellationTab)
│   │   │   │       │   ├── CoakConstellationTab.tsx  # Constellation tab root (3D canvas + overlays)
│   │   │   │       │   ├── CoakConstellationLoadingOverlay.tsx  # Keel Persona loading scrim + animation
│   │   │   │       │   ├── CoakConstellationGraphReadyContext.tsx  # Graph first-paint signal for loading overlay
│   │   │   │       │   ├── CoakStormLightningOverlay.tsx  # Storm preset intermittent lightning flashes
│   │   │   │       │   ├── CoakConstellationSearchBar.tsx  # Pill-shaped live node search overlay on canvas
│   │   │   │       │   ├── CoakConstellationBreadcrumb.tsx  # Window-header lineage breadcrumb when one node is selected
│   │   │   │       │   ├── CoakConstellationSearchNavigator.tsx  # Prev/next counter for cycling constellation search matches
│   │   │   │       │   ├── graph/
│   │   │   │       │   │   ├── CoakScene.tsx  # Full-viewport R3F canvas shell
│   │   │   │       │   │   ├── CoakGraph.tsx  # Hierarchical graph, orbit controls, focus animation
│   │   │   │       │   │   ├── CoakDraggableNode.tsx  # Draggable child node with invisible hit sphere
│   │   │   │       │   │   ├── CoakConnectionLine.tsx  # Edge line between graph nodes
│   │   │   │       │   │   ├── CoakAxisGizmo.tsx  # Blender-style X/Y/Z axis widget (top-right)
│   │   │   │       │   │   ├── CoakAxisDragRail.tsx  # Colored axis rail guide while dragging on locked axis
│   │   │   │       │   │   ├── CoakChildRevolveRails.tsx  # X/Y/Z guide rings for Revolve mode
│   │   │   │       │   │   ├── CoakOriginNode.tsx  # Glowing origin sphere with smooth pulse
│   │   │   │       │   │   ├── CoakNodeScreenAnchor.tsx  # Projects edited node to panel screen coords
│   │   │   │       │   │   ├── CoakGraphNodeContextMenu.tsx  # Right-click context menu on graph nodes
│   │   │   │       │   │   ├── CoakGraphNodeContextMenuIcons.tsx  # Shared SVG icons and menu item layout for graph context menu
│   │   │   │       │   │   ├── CoakGraphNodeContextMenuOptimizeSubmenu.tsx  # Optimize branch/inline submenu for graph context menu
│   │   │   │       │   │   ├── CoakGraphNodeContextMenuColorPalette.tsx  # Preset swatches at top of graph node context menu
│   │   │   │       │   │   ├── CoakGraphNodeContextMenuAddSubmenu.tsx  # Add cascade (Folder/Note/Flash) on graph node context menu
│   │   │   │       │   │   ├── CoakGraphNodeContextMenuFileSubmenu.tsx  # File attach/update/delete submenu on graph nodes
│   │   │   │       │   │   ├── CoakGraphNodeContextMenuPinSubmenu.tsx  # Pin submenu (self and immediate children)
│   │   │   │       │   │   ├── CoakGraphNodeContextMenuRevealSubmenu.tsx  # Reveal submenu (Immediate/Lineage) on graph nodes
│   │   │   │       │   │   ├── CoakGraphCanvasBackdrop.tsx  # Invisible sphere for empty-canvas right-click
│   │   │   │       │   │   ├── CoakGraphCanvasContextMenu.tsx  # Empty-canvas context menu (Unpin all nodes)
│   │   │   │       │   │   └── CoakItemEditorNodeDragBridge.tsx  # Drag bridge between editor and node
│   │   │   │       │   ├── node-visuals/
│   │   │   │       │   │   ├── CoakNodeSphereVisual.tsx  # Visual-style router for sphere visuals
│   │   │   │       │   │   ├── CoakFolderSphereVisual.tsx  # Folder translucent colored sphere
│   │   │   │       │   │   ├── CoakNoteSphereVisual.tsx  # Letter-shell visual for note, file, and flash nodes
│   │   │   │       │   │   ├── CoakFacetSphereVisual.tsx  # Low-poly faceted node visual
│   │   │   │       │   │   ├── CoakStripeSphereVisual.tsx  # Latitude-striped node visual
│   │   │   │       │   │   ├── CoakWireSphereVisual.tsx  # Wireframe-shell node visual
│   │   │   │       │   │   ├── CoakRingSphereVisual.tsx  # Hollow ring node visual
│   │   │   │       │   │   ├── CoakRingNodeLabel.tsx  # Truncated title centered inside ring nodes
│   │   │   │       │   │   ├── CoakNodeMoveTargetHighlight.tsx  # Pulsing glow for Move reparent targets
│   │   │   │       │   │   ├── CoakNodeLabel.tsx  # Billboard item title beside graph nodes
│   │   │   │       │   │   ├── CoakNodePinIcon.tsx  # Shared pin glyph for graph and modal badges
│   │   │   │       │   │   └── CoakNodePinBadge.tsx  # Pin icon badge on pinned graph nodes
│   │   │   │       │   └── modals/
│   │   │   │       │       ├── CoakTvModalFrame.tsx  # CRT power-on/off animation frame
│   │   │   │       │       ├── CoakItemEditorModal.tsx  # CRT-styled folder/note/flash editor modal with optional file preview
│   │   │   │       │       ├── CoakItemMediaPreview.tsx  # Shared media preview for item editor modals
│   │   │   │       │       ├── CoakNoteItemEditorBody.tsx  # Note body editor section
│   │   │   │       │       ├── CoakFolderItemEditorBody.tsx  # Folder contents list section
│   │   │   │       │       ├── CoakFolderContentRow.tsx  # Folder child row with inline rename and delete
│   │   │   │       │       ├── CoakFolderContentAddRow.tsx  # Folder add-child row with kind picker
│   │   │   │       │       ├── CoakFlashItemEditorBody.tsx  # Flip-card editor for flash items
│   │   │   │       │       ├── CoakConstellationItemEditorFrame.tsx  # Single anchored item editor in Constellation panel
│   │   │   │       │       ├── CoakConstellationItemEditorOverlay.tsx  # Multi-editor overlay in Constellation panel
│   │   │   │       │       ├── coakPinnedItemEditorLayout.ts  # Shared width constant for pinned dock modals
│   │   │   │       │       ├── CoakPinnedItemEditorFrame.tsx  # Docked editor card for a pinned constellation node
│   │   │   │       │       ├── CoakPinnedModalUnpinBadge.tsx  # Corner unpin control on pinned modals
│   │   │   │       │       └── CoakPinnedNodeEditorsOverlay.tsx  # Full-height left dock panel for pinned node editors
│   │   │   │       ├── general/
│   │   │   │       │   ├── index.ts  # Tab entry barrel (CoakGeneralTab)
│   │   │   │       │   ├── CoakGeneralTab.tsx  # Record name and color tab
│   │   │   │       │   └── CoakRecordInlineTitle.tsx  # Inline editable record title field
│   │   │   │       ├── directory/
│   │   │   │       │   ├── index.ts  # Tab entry barrel (CoakDirectoryTab)
│   │   │   │       │   ├── CoakDirectoryTab.tsx  # Directory tree tab content
│   │   │   │       │   ├── CoakDirectoryRow.tsx  # Directory row with checkbox, menu, and drag-drop
│   │   │   │       │   ├── CoakDirectoryRowMenu.tsx  # Row overflow menu with Add and File submenus
│   │   │   │       │   ├── CoakDirectorySearchBar.tsx  # Pill-shaped live directory search field
│   │   │   │       ├── tags/
│   │   │   │       │   ├── index.ts  # Tab entry barrel (CoakTagsTab)
│   │   │   │       │   └── CoakTagsTab.tsx  # Record tag catalog tab
│   │   │   │       └── settings/
│   │   │   │           ├── index.ts  # Tab entry barrel (CoakSettingsTab)
│   │   │   │           ├── CoakSettingsTab.tsx  # Constellation settings tab
│   │   │   │           ├── CoakSettingsSectionCard.tsx  # Bordered card wrapper for settings groups
│   │   │   │           ├── CoakSettingsLabel.tsx  # Setting title with hover info icon
│   │   │   │           ├── CoakSettingsInfoIcon.tsx  # Circled i icon and hover tooltip popup
│   │   │   │           ├── CoakAutoOptimizeSettingsSection.tsx  # Auto-optimize toggle, connection distance, and connection angle
│   │   │   │           ├── CoakAutoOptimizeToggle.tsx  # Auto-optimize layout on/off toggle
│   │   │   │           ├── CoakAutoOptimizeConnectionDistanceSlider.tsx  # Auto-optimize parent-child distance slider
│   │   │   │           ├── CoakAutoOptimizeConnectionAngleSlider.tsx  # Auto-optimize sibling branch angle slider
│   │   │   │           ├── CoakBackgroundPresetPicker.tsx  # Constellation background gradient presets
│   │   │   │           ├── CoakPersistentNodeModalsToggle.tsx  # Always show constellation node editor modals toggle
│   │   │   │           ├── CoakItemEditorEnlargeToggle.tsx  # Enlarge item editor modals on hover and while editing
│   │   │   │           ├── CoakConnectionColorToggle.tsx  # Constellation connection color swatches
│   │   │   │           ├── CoakConnectionWidthSlider.tsx  # Constellation connection width slider
│   │   │   │           ├── CoakOriginPulseToggle.tsx  # Origin node and connection pulse animation toggle
│   │   │   │           ├── CoakTitleColorToggle.tsx  # Constellation node label text color swatches
│   │   │   │           ├── CoakNodeVisualPreviewRowCanvas.tsx  # Shared row Canvas for node visual previews
│   │   │   │           ├── CoakNodeVisualSettingsSection.tsx  # Per-kind node visual pickers
│   │   │   │           ├── CoakNodeSizeSlider.tsx  # Constellation node diameter scale slider
│   │   │   │           ├── CoakNodeVisualStylePicker.tsx  # Selectable preview buttons for one item kind
│   │   │   ├── context/          # coak shared state
│   │   │   │   ├── index.ts  # Barrel re-export (provider, hook, types)
│   │   │   │   ├── coakWorkspaceTypes.ts  # Workspace context value and session types
│   │   │   │   ├── CoakRecordWorkspaceContext.tsx  # Provider composition and useCoakRecordWorkspace hook
│   │   │   │   └── state/          # Internal workspace state hooks
│   │   │   │       ├── useCoakWorkspaceData.ts  # Queries, persistence, derived graph/tree data
│   │   │   │       ├── useCoakItemMutations.ts  # Record and item CRUD mutations
│   │   │   │       ├── useCoakItemEditorState.ts  # Item editor and orbit state
│   │   │   │       ├── useCoakWorkspaceSearchState.ts  # Directory and constellation search state
│   │   │   │       ├── useCoakGraphSessions.ts  # Context menu, revolve, move, swap sessions
│   │   │   │       ├── useCoakNodePositioning.ts  # Node drag positions and auto-optimize layout
│   │   │   │       └── useCoakItemActions.ts  # Create, upload, rename, pin, and delete actions
│   │   │   ├── hooks/          # coak hooks
│   │   │   │   ├── useCoakTagCatalog.ts  # Tags tab catalog mutations and search
│   │   │   │   ├── panels/
│   │   │   │   │   ├── index.ts  # Barrel re-export
│   │   │   │   │   ├── useCoakDraggablePanel.ts  # Window drag, resize, and sizing
│   │   │   │   │   └── useCoakWorkspaceTabDrag.ts  # Tab tear-out, reorder, and dock drag
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── useCoakSiblingListReorder.ts  # Flat sibling-list drag reorder with insert-line preview
│   │   │   │   │   ├── constellation/
│   │   │   │   │   │   ├── index.ts  # Barrel re-export
│   │   │   │   │   │   ├── useCoakNodeReel.ts  # Smoothed scroll-wheel reel along connection or locked axis
│   │   │   │   │   │   ├── useCoakNodeAxisDrag.ts  # X/Y/Z world-axis lock while dragging nodes
│   │   │   │   │   │   ├── useCoakNodePointerDrag.ts  # Pointer drag for constellation nodes
│   │   │   │   │   │   ├── useCoakChildRevolveDrag.ts  # Drag guide rings to rotate child subtrees
│   │   │   │   │   │   ├── useCoakChildRevolveDismiss.ts  # Click empty canvas to exit Revolve mode
│   │   │   │   │   │   ├── useCoakGraphPickModeDismiss.ts  # Left-click dismiss for Move/Swap pick modes
│   │   │   │   │   │   ├── useCoakConstellationCanvasDismiss.ts  # Shared empty-canvas dismiss for editors and menus
│   │   │   │   │   │   ├── useCoakConstellationSearchSync.ts  # Live title search sync to item editors
│   │   │   │   │   │   └── useAutoResizeTextarea.ts  # Auto-height textarea sizing for item editor modals
│   │   │   │   │   └── directory/
│   │   │   │   │       ├── index.ts  # Barrel re-export
│   │   │   │   │       ├── useCoakItemFilePicker.tsx  # Single-file attach/replace picker dialogs for item file controls
│   │   │   │   │       ├── useCoakDirectorySearchSync.ts  # Live directory search sync to item editors
│   │   │   │   │       ├── useCoakDirectoryDragReorder.ts  # Directory tree drag reorder with insert-line preview
│   │   │   │   │       └── useCoakNodeSearchSync.ts  # Shared search sync for directory and constellation
│   │   │   │   └── workspace/
│   │   │   │       ├── index.ts  # Barrel re-export
│   │   │   │       ├── useCoakWorkspacePersistence.ts  # Debounced workspace state save
│   │   │   │       ├── useCoakWorkspaceSettings.ts  # Debounced panel layout save
│   │   │   │       └── useCoakConfigurationSettings.ts  # Debounced configuration settings save
│   │   │   ├── lib/          # coak helpers
│   │   │   │   ├── coakItemKindRegistry.ts  # Item kind metadata registry (labels, flags, preview/search)
│   │   │   │   ├── panels/
│   │   │   │   │   ├── index.ts  # Barrel re-export
│   │   │   │   │   ├── coakPanelGeometry.ts  # Panel clamp/resize geometry helpers
│   │   │   │   │   ├── coakPanelSettings.ts  # Legacy panel settings normalization
│   │   │   │   │   ├── coakWindowLayout.ts  # Window/tab layout barrel re-export
│   │   │   │   │   ├── coakWorkspaceLayoutModel.ts  # Window layout types, defaults, parse, migrate
│   │   │   │   │   └── coakWorkspaceLayoutOps.ts  # Pure window/tab layout transform helpers
│   │   │   │   ├── workspace/
│   │   │   │   │   ├── index.ts  # Barrel re-export
│   │   │   │   │   └── coakCanvasTone.ts  # Constellation gradient backdrop presets and CSS style helper
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── constellation/
│   │   │   │   │   │   ├── index.ts  # Barrel re-export
│   │   │   │   │   │   ├── coakNodeLayout.ts  # Node layout barrel re-export
│   │   │   │   │   │   ├── coakNodeLineage.ts  # Origin-to-node ancestor path for header breadcrumb
│   │   │   │   │   │   ├── coakVec3.ts  # 3D vector math helpers
│   │   │   │   │   │   ├── coakSiblingPositions.ts  # Sibling placement primitives for optimize layout
│   │   │   │   │   │   ├── coakOptimizeLayout.ts  # Direct-children and full-tree optimize builders
│   │   │   │   │   │   ├── coakColorUtils.ts  # Hex color normalization helper
│   │   │   │   │   │   ├── coakNodeMove.ts  # Valid reparent targets for constellation Move mode
│   │   │   │   │   │   ├── coakNodePinMenu.ts  # Immediate-child pin partition helpers for graph context menu
│   │   │   │   │   │   ├── coakNodeSwap.ts  # Sibling swap targets and position exchange helpers
│   │   │   │   │   │   ├── coakChildRevolve.ts  # Revolve pivot, parent-wrapped ring sizing, rotation math
│   │   │   │   │   │   ├── coakNodePosition.ts  # Connection-axis reel/clamp helpers
│   │   │   │   │   │   ├── coakNodeDragMath.ts  # Plane intersection math for node drag
│   │   │   │   │   │   ├── coakGraphConstants.ts  # Visual tuning constants
│   │   │   │   │   │   ├── coakConnectionEndpoints.ts  # Trim connection lines at ring node borders
│   │   │   │   │   │   ├── coakOriginPulse.ts  # Origin sphere pulse timing and connection wave helpers
│   │   │   │   │   │   ├── coakConstellationCamera.ts  # Orbit angles for directory-driven constellation view
│   │   │   │   │   │   ├── coakNoteSphereTexture.ts  # Canvas letter texture for note, file, and flash spheres
│   │   │   │   │   │   ├── coakStripeSphereTexture.ts  # Canvas latitude stripe texture for striped spheres
│   │   │   │   │   │   ├── coakItemEditorAnchor.ts  # Clamp anchored editor modal within constellation panel
│   │   │   │   │   │   └── coakItemEditorDrag.ts  # Item editor drag interaction helpers
│   │   │   │   │   ├── directory/
│   │   │   │   │   │   ├── index.ts  # Barrel re-export
│   │   │   │   │   │   ├── coakTree.ts  # Directory tree builders
│   │   │   │   │   │   ├── coakSiblingSortOrder.ts  # Sibling sort-order helpers for directory/folder drag reorder
│   │   │   │   │   │   ├── coakDirectoryPreview.ts  # Truncated note/flash preview for directory rows
│   │   │   │   │   │   └── coakDirectorySearch.ts  # Directory search matching and ancestor folder expansion
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── index.ts  # Barrel re-export
│   │   │   │   │       ├── coakAutoOptimizeSettings.ts  # Auto-optimize layout configuration helpers
│   │   │   │   │       ├── coakPersistentNodeModalsSettings.ts  # Always-show node editor modals configuration helpers
│   │   │   │   │       ├── coakItemEditorEnlargeSettings.ts  # Item editor hover/edit enlarge configuration helpers
│   │   │   │   │       ├── coakOriginPulseSettings.ts  # Origin pulse animation configuration helpers
│   │   │   │   │       ├── coakSettingsInfoCopy.ts  # Hover tooltip copy for constellation settings
│   │   │   │   │       ├── coakBackgroundSettings.ts  # Constellation background preset configuration helpers
│   │   │   │   │       ├── coakConnectionSettings.ts  # Connection color configuration helpers
│   │   │   │   │       ├── coakConnectionWidthSettings.ts  # Connection width configuration helpers
│   │   │   │   │       ├── coakNodeSizeSettings.ts  # Node diameter scale configuration helpers
│   │   │   │   │       ├── coakNodeVisualSettings.ts  # Per-kind node visual style configuration helpers
│   │   │   │   │       └── coakTitleColorSettings.ts  # Node label title color configuration helpers
│   │   │   │   ├── coakMultiSelect.ts  # Command/Ctrl modifier detection for multi-select
│   │   │   │   ├── coakRecordSearch.ts  # Record hub search matching
│   │   │   │   ├── coakTagDisplay.ts  # Tag pill color helpers
│   │   │   │   └── coakTagSearch.ts  # Tag catalog search/sort helpers
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── pages/          # coak pages
│   │   │   │   ├── CoakRecordsPage.tsx  # Record list and create
│   │   │   │   └── CoakRecordPage.tsx  # Focus and Directory workspace
│   │   │   ├── README.md  # Module architecture and routes
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── dev/          # Dev-only front-end sandbox (local dev builds only)
│   │   │   ├── components/          # dev UI components
│   │   │   │   ├── devSubpage/          # Shared subpage layout
│   │   │   │   │   └── DevSubpageFrame.tsx  # Full-height non-scrolling frame
│   │   │   │   ├── keelPersona/          # Keel Persona Builder (Animation Playground)
│   │   │   │   │   ├── KeelPersonaRenderer.tsx  # Base PNG + element stack renderer
│   │   │   │   │   ├── KeelAnimationComposer.tsx  # Wobble/spin/orbit layer wrapper
│   │   │   │   │   ├── KeelCaptionBubble.tsx  # Caption text display
│   │   │   │   │   ├── builder/          # Builder panels
│   │   │   │   │   │   ├── ColorWheelPicker.tsx  # Hue wheel color picker
│   │   │   │   │   │   ├── KeelPersonaAnimationsPanel.tsx
│   │   │   │   │   │   ├── KeelPersonaElementBank.tsx
│   │   │   │   │   │   ├── KeelPersonaElementsListPanel.tsx
│   │   │   │   │   │   ├── KeelPersonaElementPropertiesPanel.tsx
│   │   │   │   │   │   └── CopyAnimationSpecToolbarAction.tsx
│   │   │   │   │   └── elements/          # 11 composable element views + stack
│   │   │   │   ├── loadingIcon/          # Base loader + animation primitives
│   │   │   │   │   ├── KeelLoadingIcon.tsx  # Base Keel PNG (promotion candidate)
│   │   │   │   │   ├── LoadingIconSweepLineBar.tsx  # Line bar with sweep/fade clip + glow
│   │   │   │   │   ├── LoadingIconAxisSpinLayer.tsx
│   │   │   │   │   ├── LoadingIconCenterOrbitLayer.tsx
│   │   │   │   │   └── LoadingIconWobbleLayer.tsx
│   │   │   │   └── subpageToolbar/          # Scalable subpage action toolbar
│   │   │   │       ├── DevSubpageToolbar.tsx  # Toolbar container
│   │   │   │       └── DevSubpageToolbarAction.tsx  # Reusable action slot
│   │   │   ├── hooks/          # dev-only hooks
│   │   │   │   ├── useKeelPersonaBuilder.ts  # Persona element design + localStorage
│   │   │   │   ├── useKeelAnimationPlayer.ts  # Step-based clip playback
│   │   │   │   ├── useKeelLoadingEyeLineSequence.ts  # Classic eye-line sweep rAF loop
│   │   │   │   ├── useKeelTeslaLineGlow.ts  # The Tesla line-glow elapsed clock
│   │   │   │   └── useKeelEyeBlink.ts  # Eye-lid blink rAF loop
│   │   │   ├── lib/          # dev-only helpers
│   │   │   │   ├── keelPersona/          # Persona types, presets, storage, export
│   │   │   │   │   ├── presets/          # Element bank presets (gaze, accessories, …)
│   │   │   │   │   ├── exportAnimationSpec.ts  # Animation Spec v1 clipboard handoff
│   │   │   │   │   └── eyeScale.ts
│   │   │   │   ├── beamLaserStyle.ts  # Laser beam gradient and glow styles
│   │   │   │   ├── canvasPointer.ts  # Canvas coordinate helpers
│   │   │   │   ├── keelEyeBlink.ts  # Eye-lid blink corner deformation
│   │   │   │   ├── glassOverlayGeometry.ts  # Pentagon geometry and glass color
│   │   │   │   ├── loadingIconGeometry.ts
│   │   │   │   ├── loadingIconLineAnimation.ts
│   │   │   │   ├── teslaLineGlow.ts  # The Tesla mouth/outer/inner glow timeline
│   │   │   │   ├── loadingIconAxisSpin.ts  # Axis spin animation class and timing
│   │   │   │   ├── loadingIconCenterOrbitSpin.ts  # Center-point orbit animation class and timing
│   │   │   │   ├── loadingIconWobble.ts  # Wobble animation class and timing
│   │   │   │   └── sparkGlowStyle.ts  # Spark glow box-shadow styles
│   │   │   ├── manifest.ts  # Module registration for app shell
│   │   │   ├── navItem.tsx  # App nav menu entry (lab section)
│   │   │   ├── pages/          # dev pages
│   │   │   │   ├── DevSandboxPage.tsx  # Experiment hub
│   │   │   │   └── AnimationPlaygroundPage.tsx  # Keel Persona Builder
│   │   │   ├── README.md  # Module architecture and routes
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── people/
│   │   │   ├── manifest.ts  # Module registration for app shell
│   │   │   ├── navItem.tsx  # App nav menu entry (People)
│   │   │   ├── PeopleModuleLayout.tsx  # People module layout with secondary nav
│   │   │   ├── subNav.tsx  # People module secondary nav (Contacts, Figures, …)
│   │   │   ├── routes.tsx  # Route manifest (/people/* + legacy /contacts/* redirects)
│   │   │   ├── README.md  # People module (contacts + figures + shared)
│   │   │   ├── shared/          # Cross-subsection person UI
│   │   │   │   ├── lib/
│   │   │   │   │   ├── birthDate.ts  # Birth date parts, formatting, API serialization
│   │   │   │   │   └── personDisplay.ts  # personInitials helper
│   │   │   │   └── components/
│   │   │   │       ├── PersonBirthDateField.tsx
│   │   │   │       ├── PersonPhotoField.tsx
│   │   │   │       ├── PersonPhotoMenu.tsx
│   │   │   │       └── PersonInlineName.tsx
│   │   │   ├── contacts/        # Personal CRM subsection
│   │   │   │   ├── api.ts  # contacts API client (REST /contacts)
│   │   │   │   ├── components/          # contacts UI components
│   │   │   │   │   ├── browse/
│   │   │   │   │   │   ├── ContactsFilters.tsx
│   │   │   │   │   │   └── ContactsListView.tsx
│   │   │   │   │   ├── filters/
│   │   │   │   │   ├── tags/
│   │   │   │   │   ├── ContactAvatar.tsx
│   │   │   │   │   ├── ContactListRow.tsx
│   │   │   │   │   ├── FamilyTreeView.tsx
│   │   │   │   │   └── …
│   │   │   │   ├── lib/          # contactFilters, familyTree*, relationshipDisplay, …
│   │   │   │   └── pages/          # ContactsPage, ContactDetailPage, family groups, tags, tree
│   │   │   ├── figures/          # Public figures subsection
│   │   │   │   ├── api.ts
│   │   │   │   ├── components/
│   │   │   │   ├── lib/
│   │   │   │   └── pages/
│   │   ├── focus/
│   │   │   ├── api.ts  # focus API client
│   │   │   ├── api/
│   │   │   │   ├── automation.ts  # External LLM connector sessions + guide
│   │   │   │   ├── constellation.ts  # Constellation state and settings API
│   │   │   │   ├── entries.ts  # Legacy entry adapters
│   │   │   │   ├── lists.ts  # Legacy list adapters
│   │   │   │   ├── mappers.ts  # Node to list/entry mappers
│   │   │   │   ├── nodes.ts  # Focus node CRUD API
│   │   │   │   ├── queryKeys.ts  # TanStack Query key factory
│   │   │   │   ├── references.ts  # External reference search/detail API
│   │   │   │   ├── shared.ts  # Shared API helpers
│   │   │   │   ├── tags.ts  # Focus tag API
│   │   │   │   ├── timeEntries.ts  # Focus node timer state/history API
│   │   │   │   └── types.ts  # Focus API DTO types
│   │   │   ├── components/          # focus UI components
│   │   │   │   ├── cards/
│   │   │   │   │   ├── FocusQuickAdd.tsx  # Root-list quick add form
│   │   │   │   │   ├── FocusViewModeToggle.tsx  # Cards / constellation view switch
│   │   │   │   │   └── card/
│   │   │   │   │       ├── FocusListCard.tsx  # Hub list card
│   │   │   │   │       ├── FocusListCardColorPicker.tsx  # Card color picker popover
│   │   │   │   │       ├── FocusListCardColorStripe.tsx  # Card color accent stripe
│   │   │   │   │       ├── FocusListCardDepth.tsx  # Card depth/tint wrapper
│   │   │   │   │       ├── FocusListCardItemsPanel.tsx  # Nested item preview panel
│   │   │   │   │       ├── FocusListCardItemsToggle.tsx  # Item preview toggle
│   │   │   │   │       ├── FocusListCardPeekItem.tsx  # Single nested item preview
│   │   │   │   │       ├── FocusListCardTint.tsx  # Card tint overlay
│   │   │   │   │       └── index.ts  # card component barrel
│   │   │   │   ├── constellation/
│   │   │   │   │   ├── automation/
│   │   │   │   │   │   ├── FocusAutomationActivityPanel.tsx  # Bottom-right automation log overlay
│   │   │   │   │   │   ├── FocusAutomationModeButton.tsx  # Agent Mode / Agent Live header toggle
│   │   │   │   │   │   ├── FocusAutomationSessionModal.tsx  # Session token modal with copy actions
│   │   │   │   │   │   └── index.ts  # automation component barrel
│   │   │   │   │   ├── canvas/
│   │   │   │   │   │   ├── FocusConstellationAnimationContext.tsx  # Constellation animation provider
│   │   │   │   │   │   ├── FocusConstellationCanvas.constants.ts  # Canvas tones and React Flow type maps
│   │   │   │   │   │   ├── FocusConstellationCanvas.tsx  # Public constellation canvas shell
│   │   │   │   │   │   ├── FocusConstellationCanvas.types.ts  # Canvas prop and render types
│   │   │   │   │   │   ├── FocusConstellationCanvasFlow.tsx  # React Flow renderer
│   │   │   │   │   │   ├── FocusConstellationCanvasInner.tsx  # Canvas interaction wiring
│   │   │   │   │   │   ├── FocusConstellationCanvasStatus.tsx  # Canvas loading/error state
│   │   │   │   │   │   ├── FocusConstellationSaveButton.tsx  # Save layout button
│   │   │   │   │   │   └── index.ts  # canvas component barrel
│   │   │   │   │   ├── contextMenu/
│   │   │   │   │   │   ├── FocusConstellationContextMenuFlyouts.tsx  # Shared menu flyout helpers
│   │   │   │   │   │   ├── FocusConstellationContextMenuIcons.tsx  # Menu icon components
│   │   │   │   │   │   ├── FocusConstellationContextMenuStyles.ts  # Menu class constants
│   │   │   │   │   │   ├── FocusConstellationNodeAddFlyout.tsx  # Node add flyout
│   │   │   │   │   │   ├── FocusConstellationNodeColorSwatchRow.tsx  # Node color swatches
│   │   │   │   │   │   ├── FocusConstellationNodeContextMenu.tsx  # Node right-click menu
│   │   │   │   │   │   ├── FocusConstellationNodeContextMenuIconRow.tsx  # Node menu icon row
│   │   │   │   │   │   ├── FocusConstellationNodeStatusSubmenu.tsx  # Status submenu
│   │   │   │   │   │   ├── FocusConstellationPaneContextMenu.tsx  # Empty-pane right-click menu
│   │   │   │   │   │   ├── index.ts  # context-menu barrel
│   │   │   │   │   │   ├── useFocusConstellationContextMenuDismiss.ts  # Menu dismissal hook
│   │   │   │   │   │   ├── useFocusConstellationDeleteConfirm.ts  # Delete confirmation hook
│   │   │   │   │   │   └── useFocusConstellationSubmenuHover.ts  # Submenu hover timer hook
│   │   │   │   │   ├── controls/
│   │   │   │   │   │   ├── FocusConstellationConfigPanel.tsx  # Constellation settings panel
│   │   │   │   │   │   ├── FocusConstellationOrbitToggle.tsx  # Orbit play/pause toggle
│   │   │   │   │   │   ├── FocusConstellationScopeBar.tsx  # Scoped-view breadcrumb bar
│   │   │   │   │   │   ├── FocusConstellationShapeToggle.tsx  # Node shape selector
│   │   │   │   │   │   └── index.ts  # controls component barrel
│   │   │   │   │   ├── edge/
│   │   │   │   │   │   ├── FocusConstellationEdge.tsx  # Custom React Flow edge renderer
│   │   │   │   │   │   └── index.ts  # edge component barrel
│   │   │   │   │   ├── modals/
│   │   │   │   │   │   ├── FocusConstellationEntryAddModal.tsx  # Task add modal
│   │   │   │   │   │   ├── FocusConstellationItemViewModal.tsx  # Task view modal
│   │   │   │   │   │   ├── FocusConstellationListViewModal.tsx  # List view modal
│   │   │   │   │   │   ├── FocusConstellationNodeOriginModal.tsx  # Modal origin animation helper
│   │   │   │   │   │   ├── FocusConstellationStandaloneListAddModal.tsx  # Root list add modal
│   │   │   │   │   │   └── index.ts  # modal component barrel
│   │   │   │   │   ├── node/
│   │   │   │   │   │   ├── FocusConstellationNode.constants.ts  # Node constants
│   │   │   │   │   │   ├── FocusConstellationNode.tsx  # Custom React Flow node renderer
│   │   │   │   │   │   ├── FocusConstellationNode.types.ts  # Node data types
│   │   │   │   │   │   ├── FocusConstellationNodeHoverContext.tsx  # Hover notes preview state
│   │   │   │   │   │   ├── FocusConstellationNodeNotesPreview.tsx  # Bottom-left notes overlay on node hover
│   │   │   │   │   │   ├── FocusConstellationNodeStatusGlow.tsx  # Status glow renderer
│   │   │   │   │   │   ├── FocusConstellationOrbitHandle.tsx  # Manual orbit handle
│   │   │   │   │   │   ├── FocusConstellationWorkOrderBadge.tsx  # Work-order badge
│   │   │   │   │   │   └── index.ts  # node component barrel
│   │   │   │   │   ├── notes/
│   │   │   │   │   │   ├── FocusConstellationNotesPanelShell.tsx  # Draggable notes panel shell
│   │   │   │   │   │   └── index.ts  # notes component barrel
│   │   │   │   │   └── references/
│   │   │   │   │       ├── FocusReferenceInspectorInteractionContext.tsx  # Suppresses node clicks while inspector open
│   │   │   │   │       ├── FocusReferencePropertyInspector.tsx  # Reference record property inspector flyout
│   │   │   │   │       ├── FocusReferenceTypeIcon.tsx  # Reference type badge icon on record nodes
│   │   │   │   │       └── index.ts  # references component barrel
│   │   │   │   ├── forms/
│   │   │   │   │   ├── editors/
│   │   │   │   │   │   ├── FocusItemEditor.tsx  # Item editor form
│   │   │   │   │   │   ├── FocusListCreateEditor.tsx  # Blank parent-less Focus node create form
│   │   │   │   │   │   ├── FocusListEditor.tsx  # List editor shell
│   │   │   │   │   │   ├── FocusListEditorBulkToolbar.tsx  # Bulk selection toolbar
│   │   │   │   │   │   ├── FocusListEditorEntryList.tsx  # Root editor entry list with staged tree drag/drop
│   │   │   │   │   │   ├── FocusListEditorHeader.tsx  # List editor header
│   │   │   │   │   │   └── index.ts  # editor component barrel
│   │   │   │   │   ├── entry/
│   │   │   │   │   │   ├── FocusEntryAddForm.tsx  # Entry add form
│   │   │   │   │   │   ├── FocusEntryInlineTitle.tsx  # Inline entry title control
│   │   │   │   │   │   ├── FocusEntryNestedPanel.tsx  # Recursive nested entry panel with staged drag/drop zones
│   │   │   │   │   │   ├── FocusEntryRow.tsx  # Entry row renderer with drag handle, kind icons, inline title/notes, and open/delete actions
│   │   │   │   │   │   └── index.ts  # entry component barrel
│   │   │   │   │   ├── fields/
│   │   │   │   │   │   ├── FocusListTagSelect.tsx  # List tag selector
│   │   │   │   │   │   ├── FocusNodeStatusSelect.tsx  # Node status select
│   │   │   │   │   │   ├── FocusWorkOrderInput.tsx  # Work-order input
│   │   │   │   │   │   └── index.ts  # field component barrel
│   │   │   │   │   ├── timer/
│   │   │   │   │   │   ├── FocusNodeTimeEntriesPanel.tsx  # Form right-side timer history panel
│   │   │   │   │   │   ├── FocusNodeTimerControls.tsx  # Form timer controls and elapsed display
│   │   │   │   │   │   └── index.ts  # timer component barrel
│   │   │   │   │   └── modals/
│   │   │   │   │       ├── FocusRecordPickerModal.tsx  # External record picker
│   │   │   │   │       └── index.ts  # form modal barrel
│   │   │   │   └── shared/
│   │   │   │       ├── FocusInstantTooltip.tsx  # Instant hover tooltip primitive
│   │   │   │       ├── hub/
│   │   │   │       │   ├── FocusHubChromeBar.tsx  # Hub chrome bar
│   │   │   │       │   ├── FocusHubHeaderControls.tsx  # Hub header controls
│   │   │   │       │   └── index.ts  # hub component barrel
│   │   │   │       ├── icons/
│   │   │   │       │   ├── FocusListIcon.tsx  # Focus list icon
│   │   │   │       │   ├── FocusScopedConstellationIcon.tsx  # Scoped constellation icon
│   │   │   │       │   ├── TrashIcon.tsx  # Trash icon
│   │   │   │       │   └── index.ts  # icon component barrel
│   │   │   │       ├── references/
│   │   │   │       │   ├── FocusReferenceRecordLink.tsx  # Linked-record navigation link
│   │   │   │       │   └── index.ts  # reference component barrel
│   │   │   │       └── tags/
│   │   │   │           ├── FocusTagManager.tsx  # Tag manager modal
│   │   │   │           ├── FocusTagPill.tsx  # Tag pill
│   │   │   │           └── index.ts  # tag component barrel
│   │   │   ├── hooks/          # focus hooks
│   │   │   │   ├── automation/
│   │   │   │   │   ├── useFocusAutomationEndConfirm.ts  # End-session click-to-confirm timer
│   │   │   │   │   ├── useFocusAutomationLog.ts  # Automation log entry state
│   │   │   │   │   ├── useFocusAutomationRealtime.ts  # Connector SSE stream
│   │   │   │   │   └── useFocusAutomationSession.ts  # Start/end LLM session
│   │   │   │   ├── constellation/
│   │   │   │   │   ├── useFocusConstellation.ts  # Constellation data and mutations
│   │   │   │   │   ├── useFocusConstellationAlignAnimations.ts  # Child alignment animations
│   │   │   │   │   ├── useFocusConstellationCanvasDrag.ts  # Canvas node drag handling
│   │   │   │   │   ├── useFocusConstellationCanvasEdges.ts  # Canvas edge projection
│   │   │   │   │   ├── useFocusConstellationCanvasInteraction.ts  # Canvas click/menu interactions
│   │   │   │   │   ├── useFocusConstellationCanvasNodes.ts  # Canvas node projection
│   │   │   │   │   ├── useFocusConstellationCanvasOrbit.ts  # Orbit state wiring
│   │   │   │   │   ├── useFocusConstellationCanvasRenderGraph.ts  # Render graph filtering
│   │   │   │   │   ├── useFocusConstellationCanvasViewport.ts  # Viewport persistence and framing
│   │   │   │   │   ├── useFocusConstellationDraggablePanel.ts  # Draggable panel position hook
│   │   │   │   │   ├── useFocusConstellationExpandAnimations.ts  # Expand/collapse animations
│   │   │   │   │   ├── useFocusConstellationNodeNotesEditor.ts  # Selection notes editor save/blur logic
│   │   │   │   │   ├── useFocusConstellationNodeScreenCenter.ts  # Node screen-center helper
│   │   │   │   │   ├── useFocusConstellationOrbitAnimation.ts  # Orbit animation loop
│   │   │   │   │   ├── useFocusConstellationPersistence.ts  # Layout/settings persistence
│   │   │   │   │   ├── useFocusConstellationScopedGraph.ts  # Scoped graph filtering
│   │   │   │   │   ├── useFocusScopedConstellationInit.ts  # Scope entry expand/normalize on hub open
│   │   │   │   │   └── useFocusConstellationSettings.ts  # Synced constellation settings
│   │   │   │   ├── useFocusBoard.ts  # use Focus Board
│   │   │   │   ├── useFocusConstellationNodeHoverZIndex.ts  # Hover z-index helper
│   │   │   │   ├── useFocusConstellationWorkOrderBadge.ts  # Work-order badge drag hook
│   │   │   │   ├── useFocusHubMutations.ts  # Hub create/update/delete mutations
│   │   │   │   ├── useFocusEntryDragController.ts  # Staged form tree drag/drop, dwell-expand, and auto-scroll controller
│   │   │   │   ├── useFocusEntryDragTree.ts  # Working Focus entry tree for staged reorder/reparent moves
│   │   │   │   ├── useFocusListEditor.ts  # List editor state
│   │   │   │   ├── useFocusListEditorMutations.ts  # List editor mutations, including staged node moves on Save
│   │   │   │   └── useFocusNodeTimer.ts  # Node timer queries, mutations, and live elapsed tick
│   │   │   ├── lib/          # focus helpers
│   │   │   │   ├── automation/
│   │   │   │   │   ├── panToNode.ts  # Pan constellation viewport to node
│   │   │   │   │   └── setupInstructions.ts  # Copy-ready LLM setup bundle
│   │   │   │   ├── constellation/
│   │   │   │   │   ├── animation.ts  # Animation helpers
│   │   │   │   │   ├── childAlignment.ts  # Child alignment math
│   │   │   │   │   ├── draggablePanel.ts  # Panel drag persistence helpers
│   │   │   │   │   ├── graph.ts  # Constellation graph barrel
│   │   │   │   │   ├── graph/
│   │   │   │   │   │   ├── edgePlacement.ts  # Edge-aware placement helpers
│   │   │   │   │   │   ├── graphLayout.ts  # Graph layout calculation
│   │   │   │   │   │   ├── ids.ts  # Synthetic graph ids
│   │   │   │   │   │   ├── indexes.ts  # Graph indexes
│   │   │   │   │   │   ├── nodes.ts  # Node projection helpers
│   │   │   │   │   │   ├── outwardPlacement.ts  # Outward child placement
│   │   │   │   │   │   ├── types.ts  # Graph helper types
│   │   │   │   │   │   └── visibility.ts  # Visibility filtering
│   │   │   │   │   ├── interaction.ts  # Constellation interaction helpers
│   │   │   │   │   ├── layout.ts  # Layout constants/helpers
│   │   │   │   │   ├── listNodeStyle.ts  # List node styling
│   │   │   │   │   ├── modalOrigin.ts  # Modal origin animation helpers
│   │   │   │   │   ├── nodeSurfaceStyle.ts  # Node surface styling
│   │   │   │   │   ├── originOrbitHandle.ts  # Origin orbit handle helpers
│   │   │   │   │   ├── scope.ts  # Scoped graph helpers
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   ├── constants.ts  # Constellation settings constants
│   │   │   │   │   │   └── storage.ts  # Settings localStorage helpers
│   │   │   │   │   ├── viewport.ts  # Viewport math
│   │   │   │   │   └── workOrderBadge.ts  # Work-order badge positioning
│   │   │   │   ├── focus.ts  # focus lib barrel
│   │   │   │   ├── focusEntryTree.ts  # Pure helpers for staged Focus entry tree moves
│   │   │   │   ├── focus/
│   │   │   │   │   ├── hubUi.ts  # Hub display helpers
│   │   │   │   │   ├── nodeDomain.ts  # Focus node domain helpers
│   │   │   │   │   └── referenceNavigation.ts  # Reference record route resolver
│   │   │   │   └── appearance.ts  # Color/status display helpers
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── pages/          # focus pages
│   │   │   │   ├── FocusCardsPage.tsx  # Card hub page
│   │   │   │   ├── FocusConstellationPage.tsx  # Constellation hub page
│   │   │   │   ├── FocusFormPage.tsx  # Full list editor page
│   │   │   │   └── FocusHubRoute.tsx  # Hub view-mode switcher
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── home/
│   │   │   ├── api.ts  # fetchQuotes → GET /home/quotes
│   │   │   ├── cards/          # modular dashboard cards
│   │   │   │   ├── registry.ts  # Merged card pool from enabled module manifests
│   │   │   │   ├── lib/
│   │   │   │   │   └── homeCardVisibility.ts  # resolve card visibility from settings
│   │   │   │   ├── layout/
│   │   │   │   │   ├── constants.ts  # shared HOME_CONTENT_WIDTH_CLASS
│   │   │   │   │   ├── homeCardLayout.ts  # layout merge + position resolver
│   │   │   │   │   ├── homeCardResize.ts  # resize geometry + resizable card ids
│   │   │   │   │   ├── HomeCardCanvas.tsx  # draggable/resizable card canvas
│   │   │   │   │   ├── HomeCardCanvasContext.tsx  # slot sizing + interaction context
│   │   │   │   │   ├── HomeCardResizeHandles.tsx  # eight edge/corner resize handles
│   │   │   │   │   ├── useHomeCardContentScale.ts  # scales resizable card content
│   │   │   │   │   └── useHomeCardLayout.ts  # settings sync for card positions
│   │   │   │   ├── greeting/
│   │   │   │   │   ├── HomeGreetingCard.tsx  # welcome + font picker + size stepper
│   │   │   │   │   └── HomeGreetingFontSizeControl.tsx  # hover-only − / px / + stepper
│   │   │   │   ├── quotes/
│   │   │   │   │   ├── HomeQuoteCard.tsx  # quotes query + inline interval editor
│   │   │   │   │   ├── HomeQuoteDisplay.tsx  # vertical carousel + hover edit
│   │   │   │   │   ├── HomeQuoteIntervalEditor.tsx  # inline quote display time editor
│   │   │   │   │   └── lib/
│   │   │   │   │       ├── fallbackQuote.ts  # offline Einstein fallback
│   │   │   │   │       └── quoteViewport.ts  # carousel viewport height
│   │   │   │   ├── slideshow/
│   │   │   │   │   ├── HomeSlideshowCard.tsx  # settings slideshow + editor toggle
│   │   │   │   │   ├── HomeSlideshowDisplay.tsx  # one image, auto/manual advance
│   │   │   │   │   ├── HomeSlideshowEditor.tsx  # ordered list + media picker
│   │   │   │   │   └── lib/
│   │   │   │   │       └── homeSlideshowSettings.ts  # parse/build home_slideshow patch
│   │   │   │   └── alive/
│   │   │   │       ├── HomeAliveTimerCard.tsx  # alive timer query shell + target state
│   │   │   │       ├── HomeAliveTimer.tsx  # digital-clock alive timer UI
│   │   │   │       ├── HomeAliveTimerCountdown.tsx  # target countdown display
│   │   │   │       ├── HomeAliveTimerTargetEditor.tsx  # per-mode target editor
│   │   │   │       └── lib/
│   │   │   │           ├── aliveDuration.ts  # elapsed-time math per display mode
│   │   │   │           ├── aliveTargetDuration.ts  # target timestamp + countdown math
│   │   │   │           ├── aliveTimerDisplayModes.ts  # mode registry + cycle helper
│   │   │   │           ├── aliveTimerTargets.ts  # per-mode target localStorage
│   │   │   │           └── useAliveTimerTick.ts  # one-second tick hook
│   │   │   ├── homeCards.ts  # Home-owned dashboard card manifest contributions
│   │   │   ├── lib/
│   │   │   │   ├── greetingFontSize.ts  # greeting title size defaults + picker scale
│   │   │   │   ├── quoteInterval.ts  # interval defaults (shared with settings)
│   │   │   │   └── slideshowInterval.ts  # slideshow rotation defaults
│   │   │   ├── pages/
│   │   │   │   └── HomePage.tsx  # thin shell → HomeCardCanvas
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Index route → HomePage
│   │   ├── intelligence/
│   │   │   ├── components/          # intelligence UI components
│   │   │   │   ├── IntelligencePageHeader.tsx  # Intelligence Page Header
│   │   │   │   ├── IntelligenceSectionCard.tsx  # Intelligence Section Card
│   │   │   │   ├── IntelligenceTabPanel.tsx  # Intelligence Tab Panel
│   │   │   │   └── SectionIcon.tsx  # Section Icon
│   │   │   ├── lib/          # intelligence helpers
│   │   │   │   ├── display.ts  # display
│   │   │   │   └── sections.ts  # sections
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── pages/          # intelligence pages
│   │   │   │   ├── IntelligencePage.tsx  # Intelligence Page
│   │   │   │   ├── ModelsPage.tsx  # Models Page
│   │   │   │   └── ToolsPage.tsx  # Tools Page
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── media/
│   │   │   ├── api.ts  # Media folders, contents, upload, and attachment client
│   │   │   ├── components/          # media UI components
│   │   │   │   ├── attachments/          # entity attachment listing
│   │   │   │   │   ├── MediaAttachmentListRow.tsx  # Media Attachment List Row
│   │   │   │   │   ├── MediaAttachmentListView.tsx  # Media Attachment List View
│   │   │   │   │   └── index.ts  # attachments barrel
│   │   │   │   ├── browse/          # list/carousel file browser
│   │   │   │   │   ├── MediaBreadcrumbs.tsx  # Folder path breadcrumbs above list/carousel
│   │   │   │   │   ├── MediaCarouselCard.tsx  # Draggable carousel card for files and folder drop targets
│   │   │   │   │   ├── MediaCarouselView.tsx  # Centered carousel for folders and files with active metadata
│   │   │   │   │   ├── MediaFolderRow.tsx  # Folder row with drag-drop target highlight
│   │   │   │   │   ├── MediaListRow.tsx  # Media List Row
│   │   │   │   │   ├── MediaListView.tsx  # Media List View
│   │   │   │   │   ├── MediaPasteUploadDialog.tsx  # Paste-to-upload confirmation dialog with preview
│   │   │   │   │   ├── MediaViewToggle.tsx  # Segmented list/carousel view selector
│   │   │   │   │   └── index.ts  # browse barrel
│   │   │   │   ├── EntityMediaCarousel.tsx  # Horizontal gallery strip for entity forms (timeline/journal)
│   │   │   │   ├── forms/          # create/detail form chrome
│   │   │   │   │   ├── MediaForm.tsx  # Media Form
│   │   │   │   │   ├── MediaFormVideoPreview.tsx  # Media Form Video Preview
│   │   │   │   │   ├── MediaFormPageLayout.tsx  # Media Form Page Layout
│   │   │   │   │   ├── MediaInlineTitle.tsx  # Media Inline Title
│   │   │   │   │   ├── MediaMetadataPanel.tsx  # Media Metadata Panel
│   │   │   │   │   └── index.ts  # forms barrel
│   │   │   │   ├── pickers/          # cross-module source/picker dialogs
│   │   │   │   │   ├── MediaImagePickerDialog.tsx  # Searchable picker modal for existing image media
│   │   │   │   │   ├── MediaObjectPickerDialog.tsx  # Searchable picker for any ready media object
│   │   │   │   │   ├── MediaObjectPickerList.tsx  # Searchable media list for inline or modal pickers
│   │   │   │   │   ├── MediaPickerBreadcrumbs.tsx  # Compact folder path breadcrumbs for picker modals
│   │   │   │   │   ├── MediaFolderDestinationPicker.tsx  # Folder browse + new-folder draft for paste upload dialog
│   │   │   │   │   ├── MediaPickerFolderRow.tsx  # Folder navigation row for media picker browse lists
│   │   │   │   │   ├── MediaSourceChoiceDialog.tsx  # Compact source menu for existing media or local upload
│   │   │   │   │   └── index.ts  # pickers barrel
│   │   │   │   ├── panels/          # display panel list and grid
│   │   │   │   │   ├── contextMenu/          # tile right-click menu
│   │   │   │   │   │   ├── MediaPanelTileColorSwatchRow.tsx  # Border color swatches
│   │   │   │   │   │   ├── MediaPanelTileContextMenu.tsx  # Tile context menu shell
│   │   │   │   │   │   ├── MediaPanelTileContextMenuIconRow.tsx  # Icon action row (delete, details, view, swap)
│   │   │   │   │   │   ├── MediaPanelTileContextMenuIcons.tsx  # Context menu icons and icon buttons
│   │   │   │   │   │   ├── MediaPanelTileContextMenuStyles.ts  # Context menu panel and icon styles
│   │   │   │   │   │   ├── MediaPanelTileViewModal.tsx  # Full-size tile preview modal
│   │   │   │   │   │   ├── panelTileRect.ts  # Tile rect helpers for view modal animation
│   │   │   │   │   │   ├── useMediaPanelTileContextMenuDismiss.ts  # Click-outside dismiss
│   │   │   │   │   │   └── useMediaPanelTileDeleteConfirm.ts  # Two-step delete confirm timer
│   │   │   │   │   ├── MediaPanelGrid.tsx  # Full-bleed CSS grid container for panel tiles
│   │   │   │   │   ├── MediaPanelViewportHandle.tsx  # Bottom-edge grip for panel height resize
│   │   │   │   │   ├── MediaPanelMiniPreview.tsx  # Scaled read-only panel grid preview for list/carousel
│   │   │   │   │   ├── MediaPanelRow.tsx  # Panel list table row
│   │   │   │   │   ├── MediaPanelTile.tsx  # Flip-card panel tile
│   │   │   │   │   ├── MediaPanelToolbar.tsx  # Panel edit toolbar
│   │   │   │   │   ├── MediaPanelToolbarActions.tsx  # Shared edit/delete action buttons
│   │   │   │   │   ├── MediaPanelsCarouselView.tsx  # Horizontally scrolling panels carousel
│   │   │   │   │   ├── MediaPanelsListView.tsx  # Panel list table shell
│   │   │   │   │   └── index.ts  # panels barrel
│   │   │   │   └── shared/          # cross-cutting building blocks
│   │   │   │       ├── InlineEditableTitle.tsx  # Click-to-edit title with auto-save
│   │   │   │       ├── MediaPreview.tsx  # Media Preview
│   │   │   │       ├── actions/          # action buttons
│   │   │   │       │   ├── ConfirmDeleteButton.tsx  # Confirm Delete Button
│   │   │   │       │   ├── ConfirmTrashButton.tsx  # Confirm Trash Button
│   │   │   │       │   ├── MediaDownloadButton.tsx  # Media Download Button
│   │   │   │       │   ├── MediaPreviewCopyButton.tsx  # Media Preview Copy Button
│   │   │   │       │   └── index.ts  # actions barrel
│   │   │   │       └── icons/          # media glyphs
│   │   │   │           ├── MediaFileIcon.tsx  # File glyph for upload actions
│   │   │   │           ├── MediaFolderIcon.tsx  # Folder glyph for list and carousel
│   │   │   │           ├── MediaKindIcon.tsx  # Media Kind Icon
│   │   │   │           └── index.ts  # icons barrel
│   │   │   ├── hooks/          # media hooks
│   │   │   │   ├── useHorizontalDragAutoScroll.ts  # Horizontal auto-scroll during HTML drag gestures
│   │   │   │   ├── useMediaFileFolderDrag.ts  # Drag state for moving files and folders into folders
│   │   │   │   ├── useMediaRowLongPressDrag.ts  # Half-second hold before list row drag starts
│   │   │   │   ├── useMediaBlobObjectUrl.ts  # Credentialed media blob object URL for inline video
│   │   │   │   ├── useMediaPasteUpload.ts  # Queue pasted files for browse-page upload confirmation
│   │   │   │   ├── useMediaPanelGridResize.ts  # Elastic panel tile resize with batch layout save
│   │   │   │   ├── useMediaPanelViewportHeight.ts  # Drag-to-resize panel viewport height (localStorage)
│   │   │   ├── lib/          # media helpers
│   │   │   │   ├── attachments.ts  # Attachment entity labels and detail routes
│   │   │   │   ├── copy.ts  # Clipboard copy helper for stored media
│   │   │   │   ├── download.ts  # Browser download helper for stored media
│   │   │   │   ├── media.ts  # Status labels, byte size, date formatting, upload metadata
│   │   │   │   ├── mediaItems.ts  # Unified folder/file browse item helpers
│   │   │   │   ├── mediaPickerBrowse.ts  # Search and filter helpers for folder-aware media picker browsing
│   │   │   │   ├── mediaPickerPagination.ts  # Client-side pagination helpers for picker modals
│   │   │   │   ├── mediaView.ts  # LocalStorage-backed media list view preference
│   │   │   │   ├── panelGrid.ts  # Panel grid coordinate helpers
│   │   │   │   ├── panelGridReflow.ts  # Elastic resize and compact-on-remove helpers
│   │   │   │   ├── panelGridSplit.ts  # Split one tile to make room for a new panel item
│   │   │   │   ├── panelGridMetrics.ts  # Panel grid metrics, viewport height, and add-zone helpers
│   │   │   │   ├── panelViewportHeight.ts  # localStorage persistence for panel viewport height
│   │   │   │   ├── panelGridEdgeAppend.ts  # Edge append layout compression for top/left/right add zones
│   │   │   │   ├── panelView.ts  # LocalStorage-backed panels list view preference
│   │   │   ├── MediaModuleLayout.tsx  # Layout shell with Media / Panels secondary tabs
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── pages/          # media pages
│   │   │   │   ├── MediaCreatePage.tsx  # Media Create Page
│   │   │   │   ├── MediaDetailPage.tsx  # Media Detail Page
│   │   │   │   ├── MediaPanelPage.tsx  # Display panel grid page
│   │   │   │   ├── MediaPanelsListPage.tsx  # Display panel list page
│   │   │   │   └── MediaPage.tsx  # Media Page
│   │   │   ├── manifest.ts  # Module registration for app shell
│   │   │   ├── routes.tsx  # Route manifest (nested under MediaModuleLayout)
│   │   │   └── subNav.tsx  # Secondary nav tab definitions for media module
│   │   ├── projects/
│   │   │   ├── api.ts  # projects API client
│   │   │   ├── components/          # projects UI components
│   │   │   │   ├── card/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ProjectCard.tsx  # Project Card
│   │   │   │   │   ├── ProjectCardMenu.tsx  # Project Card Menu
│   │   │   │   │   ├── ProjectCardWorkspaceButton.tsx  # Project Card Workspace Button
│   │   │   │   │   └── ProjectTitle.tsx  # Project Title
│   │   │   │   ├── common/
│   │   │   │   │   ├── AppearanceBrightnessSlider.tsx  # Appearance Brightness Slider
│   │   │   │   │   ├── AutoSizeTextarea.tsx  # Auto Size Textarea
│   │   │   │   │   ├── ColorSwatchPicker.tsx  # Color Swatch Picker
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   └── WorkspaceCanvasIcon.tsx  # Workspace Canvas Icon
│   │   │   │   ├── cover/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ProjectCoverImage.tsx  # Project Cover Image
│   │   │   │   │   ├── ProjectCoverModelGlow.tsx  # Project Cover Model Glow
│   │   │   │   │   └── ProjectCoverStl.tsx  # Project Cover Stl
│   │   │   │   ├── detail/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ProjectDetailAppearanceColors.tsx  # Project Detail Appearance Colors
│   │   │   │   │   ├── ProjectDetailCoverPanel.tsx  # Project Detail Cover Panel
│   │   │   │   │   ├── ProjectDetailInlineDescription.tsx  # Project Detail Inline Description
│   │   │   │   │   ├── ProjectDetailInlineStatus.tsx  # Project Detail Inline Status
│   │   │   │   │   ├── ProjectDetailInlineTags.tsx  # Project Detail Inline Tags
│   │   │   │   │   ├── ProjectDetailInlineTitle.tsx  # Project Detail Inline Title
│   │   │   │   │   ├── ProjectDetailInlineTitleFontPicker.tsx  # Project Detail Inline Title Font Picker
│   │   │   │   │   ├── ProjectDetailLayout.tsx  # Project Detail Layout
│   │   │   │   │   ├── ProjectDetailView.tsx  # Project Detail View
│   │   │   │   │   └── ProjectWorkspaceNavLink.tsx  # Project Workspace Nav Link
│   │   │   │   ├── kanban/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ProjectKanbanBoard.tsx  # Project Kanban Board
│   │   │   │   │   ├── ProjectKanbanBorderPreview.tsx  # Project Kanban Border Preview
│   │   │   │   │   ├── ProjectKanbanFlatGrid.tsx  # Project Kanban Flat Grid
│   │   │   │   │   ├── ProjectKanbanGrid.tsx  # Project Kanban Grid
│   │   │   │   │   ├── ProjectKanbanGroupToggle.tsx  # Project Kanban Group Toggle
│   │   │   │   │   └── ProjectKanbanStatusRow.tsx  # Project Kanban Status Row
│   │   │   │   ├── media/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ProjectFilesSection.tsx  # Project Files Section
│   │   │   │   │   ├── ProjectFolderBreadcrumb.tsx  # Project Folder Breadcrumb
│   │   │   │   │   ├── ProjectFolderCard.tsx  # Project Folder Card
│   │   │   │   │   ├── ProjectFolderCardDropLayer.tsx  # Full-card drop target overlay during file drag
│   │   │   │   │   ├── ProjectFolderDragPreviewIcon.tsx  # Folder icon for drag ghosts
│   │   │   │   │   ├── ProjectItemDragPreview.tsx  # Off-screen drag ghost shell
│   │   │   │   │   ├── ProjectMediaAddCard.tsx  # Project Media Add Card
│   │   │   │   │   ├── ProjectMediaCard.tsx  # Project Media Card
│   │   │   │   │   ├── ProjectMediaCardMenu.tsx  # Project Media Card Menu
│   │   │   │   │   ├── ProjectMediaDragPreviewContent.tsx  # Drag ghost thumbnail content
│   │   │   │   │   ├── ProjectMediaInlineFilename.tsx  # Project Media Inline Filename
│   │   │   │   │   ├── ProjectMediaPreview.tsx  # Project Media Preview
│   │   │   │   │   ├── ProjectPendingFolderCard.tsx  # Project Pending Folder Card
│   │   │   │   │   ├── ProjectPendingMediaCard.tsx  # Project Pending Media Card
│   │   │   │   │   ├── ProjectPendingMediaSelectionCard.tsx  # Project Pending Media Selection Card
│   │   │   │   │   ├── projectMediaCardStyles.ts  # Draft-state border classes for project file cards
│   │   │   │   │   └── useProjectFilesDropHandlers.ts  # use Project Files Drop Handlers
│   │   │   │   ├── tags/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ProjectTagListRow.tsx  # Tag catalog table row
│   │   │   │   │   ├── ProjectTagPill.tsx  # Project Tag Pill
│   │   │   │   │   └── ProjectTagsListView.tsx  # Tag catalog list view
│   │   │   │   └── workspace/
│   │   │   │       ├── index.ts  # Page-level workspace component exports
│   │   │   │       ├── canvas/
│   │   │   │       │   ├── ProjectWorkspaceCanvas.tsx  # Project Workspace Canvas
│   │   │   │       │   ├── WorkspaceCanvasContextMenu.tsx  # Workspace Canvas Context Menu
│   │   │   │       │   ├── WorkspaceConnectionLine.tsx  # Workspace Connection Line
│   │   │   │       │   ├── WorkspaceSnapThread.tsx  # Workspace Snap Thread
│   │   │   │       │   ├── WorkspaceToolbar.tsx  # Workspace Toolbar
│   │   │   │       │   └── useWorkspaceCanvasDeleteConfirm.ts  # Two-step delete confirm for canvas context menu
│   │   │   │       ├── context/
│   │   │   │       │   ├── WorkspaceCanvasContext.tsx  # Workspace Canvas Context
│   │   │   │       │   └── WorkspaceViewContext.tsx  # Workspace View Context
│   │   │   │       ├── edges/
│   │   │   │       │   ├── WorkspaceEdge.tsx  # Workspace Edge
│   │   │   │       │   ├── WorkspaceEdgeLabelBackdrops.tsx  # Workspace Edge Label Backdrops
│   │   │   │       │   ├── WorkspaceEdgeLabelEditor.tsx  # Workspace Edge Label Editor
│   │   │   │       │   ├── WorkspaceEdgePathStyleToggle.tsx  # Workspace Edge Path Style Toggle
│   │   │   │       │   └── WorkspaceEdgeToolbar.tsx  # Workspace Edge Toolbar
│   │   │   │       ├── nodes/
│   │   │   │       │   ├── WorkspaceMediaNode.tsx  # Workspace Media Node
│   │   │   │       │   ├── WorkspaceMediaToolbar.tsx  # Workspace Media Toolbar
│   │   │   │       │   ├── WorkspaceNodeContainer.tsx  # Workspace Node Container
│   │   │   │       │   ├── WorkspaceNodeHandles.tsx  # Workspace Node Handles
│   │   │   │       │   ├── WorkspaceNodeHandlesLayer.tsx  # Connection handles above node drag surfaces
│   │   │   │       │   ├── WorkspaceNodeResizer.tsx  # Workspace Node Resizer
│   │   │   │       │   ├── WorkspaceNodeShapeOutline.tsx  # Workspace Node Shape Outline
│   │   │   │       │   ├── WorkspaceNodeSideGradients.tsx  # Workspace Node Side Gradients
│   │   │   │       │   ├── WorkspaceNoteNode.tsx  # Workspace Note Node
│   │   │   │       │   ├── WorkspaceNoteMarkdown.tsx  # GFM preview with note cross-reference pills
│   │   │   │       │   ├── WorkspaceNoteRefPicker.tsx  # @ mention popover for note cross-references
│   │   │   │       │   ├── WorkspaceNoteRefPill.tsx  # Inline tag pill for referenced notes
│   │   │   │       │   ├── WorkspaceNoteDeleteButton.tsx  # Two-step delete control for note toolbar
│   │   │   │       │   ├── WorkspaceNoteBodySelectionActionRow.tsx  # Selection-toolbar action row
│   │   │   │       │   ├── WorkspaceNoteBodyContextMenu.tsx  # Body-editing right-click menu
│   │   │   │       │   ├── WorkspaceNoteBodySelectionToolbar.tsx  # Floating toolbar for highlighted note body text
│   │   │   │       │   ├── WorkspaceNoteBodyTextFormatToolbar.tsx  # Bold/italic/strike/color controls for note selections
│   │   │   │       │   ├── workspaceNoteBodyContextMenuActions.tsx  # Right-click action registry for note body editing
│   │   │   │       │   ├── workspaceNoteBodySelectionActions.ts  # Selection-toolbar action registry
│   │   │   │       │   └── WorkspaceNoteToolbar.tsx  # Workspace Note Toolbar
│   │   │   │       ├── panel/
│   │   │   │       │   ├── workspaceCanvasListStyles.ts  # Shared grid layout for workspace Canvas tab rows
│   │   │   │       │   ├── workspaceFilePanelRowStyles.ts  # Shared compact card styling for workspace side panel rows
│   │   │   │       │   ├── WorkspaceFileFocusedPreview.tsx  # Expanded image preview for focused file
│   │   │   │       │   ├── WorkspaceFileListRow.tsx  # Saved media row with canvas drag and folder HTML drag
│   │   │   │       │   ├── WorkspaceFileRowMenu.tsx  # Shared side panel row menu
│   │   │   │       │   ├── WorkspaceFileThumbnail.tsx  # Workspace File Thumbnail
│   │   │   │       │   ├── WorkspaceFilesTab.tsx  # Workspace Files Tab
│   │   │   │       │   ├── WorkspaceCanvasListRow.tsx  # Canvas row for workspace Canvases tab
│   │   │   │       │   ├── WorkspaceCanvasesTab.tsx  # Workspace Canvases tab
│   │   │   │       │   ├── WorkspaceFolderListRow.tsx  # Folder row for workspace files side panel
│   │   │   │       │   ├── WorkspaceGeneralStatsPanel.tsx  # Overview stat cards for workspace General tab
│   │   │   │       │   ├── WorkspaceGeneralTab.tsx  # General project info editor for the workspace side panel
│   │   │   │       │   ├── WorkspaceMediaDragPreview.tsx  # Workspace Media Drag Preview
│   │   │   │       │   ├── WorkspaceNoteListRow.tsx  # Live note-card row for the workspace Notes tab
│   │   │   │       │   ├── WorkspaceNotesTab.tsx  # Workspace Notes Tab
│   │   │   │       │   ├── WorkspaceSidePanel.tsx  # Workspace Side Panel with General/Files/Notes/Canvases tabs
│   │   │   │       │   └── WorkspaceSidePanelReveal.tsx  # Workspace Side Panel Reveal
│   │   │   │       ├── settings/
│   │   │   │       │   ├── WorkspaceCanvasColorToggle.tsx  # Workspace Canvas Color Toggle
│   │   │   │       │   ├── WorkspaceCanvasConfigPanel.tsx  # Workspace Canvas Config Panel
│   │   │   │       │   ├── WorkspaceCanvasConnectionStyleToggle.tsx  # Workspace Canvas Connection Style Toggle
│   │   │   │       │   ├── WorkspaceCanvasMinimapToggle.tsx  # Workspace canvas preview map visibility toggle
│   │   │   │       │   ├── WorkspaceCanvasTextFontSlider.tsx  # Workspace Canvas Text Font Slider
│   │   │   │       │   ├── WorkspaceChromeToggle.tsx  # Workspace Chrome Toggle
│   │   │   │       │   ├── WorkspaceColorPalette.tsx  # Workspace Color Palette
│   │   │   │       │   ├── WorkspaceContainerShapeToggle.tsx  # Workspace Container Shape Toggle
│   │   │   │       │   ├── WorkspaceGridDotStrengthSlider.tsx  # Workspace canvas grid dot prominence slider
│   │   │   │       │   ├── WorkspaceNoteColorPalette.tsx  # Workspace Note Color Palette
│   │   │   │       │   ├── WorkspaceNoteColorStyleToggle.tsx  # Workspace note-card color treatment setting
│   │   │   │       │   ├── WorkspaceNoteItalicColorToggle.tsx  # Workspace note Markdown italic color palette
│   │   │   │       │   └── WorkspaceTransparencyToggle.tsx  # Workspace Transparency Toggle
│   │   │   │       └── overlays/
│   │   │   │           ├── WorkspaceEditableNoteCard.tsx  # Shared editable note card for reference modal and grid
│   │   │   │           ├── WorkspaceImageLightbox.tsx  # Workspace Image Lightbox
│   │   │   │           ├── WorkspaceNotesGridContextMenu.tsx  # Right-click context menu for notes grid tiles
│   │   │   │           ├── WorkspaceNotesGridOverlay.tsx  # Full-window notes grid overlay
│   │   │   │           ├── WorkspaceNotesGridResizeEdges.tsx  # Shared proximity-revealed resize bars for notes grid
│   │   │   │           ├── WorkspaceNotesGridTile.tsx  # Note tile in notes grid overlay
│   │   │   │           ├── WorkspaceNotesGridTileAddZones.tsx  # Per-tile edge hover plus zones for split-add
│   │   │   │           ├── workspaceNoteReferenceMotion.ts  # Note reference modal expand/collapse motion variants
│   │   │   │           └── WorkspaceNoteReferenceModal.tsx  # Editable modal for referenced note cards
│   │   │   ├── hooks/          # projects hooks
│   │   │   │   ├── usePagePaste.ts  # use Page Paste
│   │   │   │   ├── useProjectFileFolderDrag.ts  # use Project File Folder Drag
│   │   │   │   ├── useProjectTagCatalog.ts  # Tags subpage CRUD + search
│   │   │   │   ├── useProjectMediaDragPreviewUrl.ts  # Prefetch blob URLs for file drag ghosts
│   │   │   │   ├── useWorkspaceProjectSummary.ts  # Canvas, note, and file counts for workspace General tab
│   │   │   │   ├── useWorkspaceCanvases.ts  # List/create/rename/delete/switch workspace canvases
│   │   │   │   ├── useWorkspaceAutosave.ts  # use Workspace Autosave
│   │   │   │   ├── useWorkspaceCanvasPasteFocus.ts  # Capture-phase canvas paste target
│   │   │   │   ├── useWorkspaceCanvasPasteUpload.ts  # Canvas paste upload + node placement
│   │   │   │   ├── useWorkspaceFilesPanel.ts  # use Workspace Files Panel
│   │   │   │   ├── useWorkspaceHistory.ts  # use Workspace History
│   │   │   │   ├── useWorkspaceNodeConnectedSides.ts  # use Workspace Node Connected Sides
│   │   │   │   ├── useWorkspaceNodeHover.ts  # Hover-to-show connection handles
│   │   │   │   ├── useWorkspaceNoteBodyEditing.ts      # Note body draft, formatting toolbar, and context menu
│   │   │   │   ├── useWorkspaceNoteRefPicker.ts  # @ mention picker for note cross-references
│   │   │   │   ├── useWorkspaceNoteTextSelection.ts  # Text selection tracking for note body formatting toolbar
│   │   │   │   ├── useWorkspaceNotesGridEdgeProximity.ts  # Proximity tracking for shared notes grid resize edges
│   │   │   │   ├── useWorkspaceNotesGridResize.ts  # Elastic resize for workspace notes grid overlay tiles
│   │   │   │   ├── useWorkspaceNotesGridSplitAdd.ts  # Split-add notes from tile edge hover in notes grid
│   │   │   │   ├── useWorkspaceNotesGridSwap.ts  # Two-step panel swap mode for notes grid overlay
│   │   │   │   ├── useWorkspacePanelLayout.ts  # use Workspace Panel Layout
│   │   │   │   └── useProjectWorkspaceSettings.ts  # Per-project workspace canvas UI settings (API)
│   │   │   ├── lib/          # projects helpers
│   │   │   │   ├── project/
│   │   │   │   │   ├── appearance/
│   │   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   │   ├── projectAppearance.ts  # project Appearance
│   │   │   │   │   │   ├── projectAppearanceDraft.ts  # project Appearance Draft
│   │   │   │   │   │   ├── projectCoverGlow.ts  # project Cover Glow
│   │   │   │   │   │   └── projectTitleFont.ts  # project Title Font
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── kanban/
│   │   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   │   ├── projectKanbanBoard.ts  # project Kanban Board
│   │   │   │   │   │   ├── projectKanbanView.ts  # project Kanban View
│   │   │   │   │   │   └── useKanbanProjectPointerDrag.ts  # use Kanban Project Pointer Drag
│   │   │   │   │   ├── media/
│   │   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   │   ├── projectMediaDisplay.ts  # project Media Display
│   │   │   │   │   │   ├── projectFileFolderDrag.ts  # project File Folder Drag
│   │   │   │   │   │   ├── projectFileFolderDragSession.ts  # In-memory drag payload for reliable folder drops
│   │   │   │   │   │   ├── projectFileFolderScope.ts  # Shared folder scope helpers for project file browsers
│   │   │   │   │   │   ├── projectFolderDraft.ts  # project Folder Draft
│   │   │   │   │   │   ├── projectMediaDraft.ts  # project Media Draft
│   │   │   │   │   │   ├── projectMediaObjectUrl.ts  # project Media Object Url
│   │   │   │   │   │   └── projectMediaTypes.ts  # project Media Types
│   │   │   │   │   ├── projectCreatePreview.ts  # project Create Preview
│   │   │   │   │   ├── projectStatus.ts  # project Status
│   │   │   │   │   ├── projectTagDisplay.ts  # project Tag Display
│   │   │   │   │   └── projectTagSearch.ts  # project tag search/sort helpers
│   │   │   │   └── workspace/
│   │   │   │       ├── canvas/
│   │   │   │       │   ├── index.ts  # index
│   │   │   │       │   ├── workspaceCanvasMedia.ts  # workspace Canvas Media
│   │   │   │       │   ├── workspaceCanvasPaste.ts  # workspace Canvas Paste
│   │   │   │       │   ├── workspaceCanvasPasteFocus.ts  # Canvas last-click paste target
│   │   │   │       │   ├── workspaceCanvasSelection.ts  # workspace Canvas Selection
│   │   │   │       │   ├── workspaceClipboard.ts  # workspace Clipboard
│   │   │   │       │   └── workspaceDrag.ts  # workspace Drag
│   │   │   │       ├── edge/
│   │   │   │       │   ├── index.ts  # index
│   │   │   │       │   ├── workspaceEdgeCleanup.ts  # workspace Edge Cleanup
│   │   │   │       │   ├── workspaceEdgeGeometry.ts  # workspace Edge Geometry
│   │   │   │       │   ├── workspaceEdgeLabel.ts  # workspace Edge Label
│   │   │   │       │   ├── workspaceEdgeMeta.ts  # workspace Edge Meta
│   │   │   │       │   └── workspaceEdgeNormalize.ts  # workspace Edge Normalize
│   │   │   │       ├── index.ts  # index
│   │   │   │       ├── node/
│   │   │   │       │   ├── index.ts  # index
│   │   │   │       │   ├── workspaceNodeSelection.ts  # workspace Node Selection
│   │   │   │       │   ├── workspaceNodeShape.ts  # workspace Node Shape
│   │   │   │       │   ├── workspaceNoteColors.ts  # workspace Note Colors
│   │   │   │       │   └── workspaceNoteColorStyle.ts  # Workspace note-card color treatment resolver
│   │   │   │       ├── note/
│   │   │   │       │   ├── index.ts  # Note cross-reference exports
│   │   │   │       │   ├── workspaceNoteRefRemark.ts  # Markdown preprocessing for note wiki-links
│   │   │   │       │   ├── workspaceNoteRefSyntax.ts  # Wiki-link syntax and @ mention helpers
│   │   │   │       │   ├── workspaceNotesGridContextMenuActions.tsx  # Right-click action registry for notes grid tiles
│   │   │   │       │   ├── workspaceNotesGridLayout.ts  # Notes grid overlay layout and localStorage persistence
│   │   │   │       │   ├── workspaceNotesGridMeasure.ts  # Measure note card heights for grid fit layout
│   │   │   │       │   ├── workspaceNotesGridResizeEdges.ts  # Shared grid boundary segments for notes grid resize
│   │   │   │       │   ├── workspaceNoteMarkdownEdit.ts  # Note body markdown insert and formatting helpers
│   │   │   │       │   ├── workspaceNoteTextColorSyntax.ts  # Inline text color markers for note bodies
│   │   │   │       │   └── workspaceNoteTextSelectionPosition.ts  # Textarea selection coordinates for floating toolbars
│   │   │   │       ├── panel/
│   │   │   │       │   ├── index.ts  # index
│   │   │   │       │   ├── workspacePanelConfig.ts  # workspace Panel Config
│   │   │   │       │   └── workspacePanelStorage.ts  # workspace Panel Storage
│   │   │   │       ├── projectWorkspace.ts  # project Workspace
│   │   │   │       ├── snap/
│   │   │   │       │   ├── index.ts  # index
│   │   │   │       │   ├── workspaceBoxSnap.ts  # workspace Box Snap
│   │   │   │       │   ├── workspaceHexagonSnap.ts  # workspace Hexagon Snap
│   │   │   │       │   ├── workspaceShapeSnap.ts  # workspace Shape Snap
│   │   │   │       │   ├── workspaceSnapShared.ts  # workspace Snap Shared
│   │   │   │       │   └── workspaceSnapStorage.ts  # workspace Snap Storage
│   │   │   │       └── workspaceMediaDragSession.ts  # workspace Media Drag Session
│   │   │   ├── navItem.tsx  # App nav menu entry
│   │   │   ├── ProjectsModuleLayout.tsx  # Module sub-nav layout
│   │   │   ├── subNav.tsx  # Projects · Tags tabs
│   │   │   ├── pages/          # projects pages
│   │   │   │   ├── ProjectCreatePage.tsx  # Project Create Page
│   │   │   │   ├── ProjectDetailPage.tsx  # Project Detail Page
│   │   │   │   ├── ProjectsPage.tsx  # Projects Page
│   │   │   │   ├── ProjectsTagsPage.tsx  # Project tags catalog
│   │   │   │   ├── ProjectWorkspacePage.tsx  # Project Workspace Page
│   │   │   │   └── ProjectWorkspaceRedirect.tsx  # Redirect /workspace to default canvas
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # Route manifest
│   │   ├── deleted/
│   │   │   ├── api.ts  # fetchDeletedRecords, restore, purge → /deleted
│   │   │   ├── components/
│   │   │   │   ├── RecentlyDeletedListRow.tsx
│   │   │   │   ├── RecentlyDeletedListView.tsx
│   │   │   │   └── RecentlyDeletedSettingsTab.tsx
│   │   │   ├── lib/
│   │   │   │   ├── deletedDaysLeft.ts
│   │   │   │   ├── deletedListLayout.ts
│   │   │   │   └── deletedListSort.ts
│   │   │   ├── manifest.ts  # Manifest-only: settingsTabs contribution
│   │   │   ├── settingsTabs.ts  # Recently Deleted tab definition
│   │   │   └── README.md
│   │   ├── settings/
│   │   │   ├── api.ts  # fetchSettings, patchSettings → /settings
│   │   │   ├── components/          # settings UI components
│   │   │   │   ├── context/          # components React context
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   ├── ThemeSettingsContext.tsx  # Theme state + PATCH /settings on change
│   │   │   │   │   ├── BackgroundSettingsContext.tsx  # Shell wallpaper state + debounced PATCH
│   │   │   │   │   └── TransitionSettingsContext.tsx  # Transition state + debounced PATCH
│   │   │   │   ├── BackgroundSettingsSection.tsx  # Wallpaper picker + toggle (General tab)
│   │   │   │   ├── BreadcrumbSettingsSection.tsx  # Breadcrumb max entries (General tab)
│   │   │   │   ├── NavWaveGlowSettingsSection.tsx  # Nav wave glow toggle (General tab)
│   │   │   │   ├── GeneralSettingsTabPanel.tsx  # General tab panel wrapper (loads user)
│   │   │   │   ├── GeneralSettingsTab.tsx  # Profile + background + breadcrumb + wave glow + transitions
│   │   │   │   ├── HomeCardsSettingsTab.tsx  # Home card visibility toggles
│   │   │   │   ├── AnimationsSettingsTab.tsx  # Registered Keel Persona clip gallery
│   │   │   │   ├── AnimationViewToggle.tsx  # Cards vs carousel view selector
│   │   │   │   ├── KeelAnimationCarouselView.tsx  # Horizontal focus carousel for animations
│   │   │   │   ├── KeelAnimationSettingsCard.tsx  # Single animation card (player + quips)
│   │   │   │   ├── ProfileNameSection.tsx  # Profile Name Section
│   │   │   │   ├── ProfilePictureField.tsx  # Profile picture upload/picker
│   │   │   │   ├── SettingsPageTabs.tsx  # Tab bar for settings page
│   │   │   │   ├── settingsTabRegistry.tsx  # Merged settings tabs from enabled manifests
│   │   │   │   └── ThemesSettingsTab.tsx  # Global theme picker
│   │   │   ├── hooks/          # settings hooks
│   │   │   │   └── useSettingsServerSync.ts  # Hydrate theme/background/transitions from server after login
│   │   │   ├── lib/          # settings helpers
│   │   │   │   ├── animationView.ts  # Animations tab cards/carousel view preference
│   │   │   │   ├── config/
│   │   │   │   │   ├── index.ts  # index
│   │   │   │   │   └── settingsTabsConfig.ts  # settings Tabs Config
│   │   │   │   ├── background/
│   │   │   │   │   ├── index.ts  # Shell background exports
│   │   │   │   │   └── shellBackgroundSettings.ts  # localStorage + normalization
│   │   │   │   ├── theme/
│   │   │   │   │   ├── index.ts  # Theme registry exports
│   │   │   │   │   └── themeSettings.ts  # theme Settings
│   │   │   │   └── transition/
│   │   │   │       ├── index.ts  # Transition settings exports
│   │   │   │       └── transitionSettings.ts  # Presets + localStorage + resolve helpers
│   │   │   ├── pages/          # settings pages
│   │   │   │   └── SettingsPage.tsx  # Tabbed settings + profile Save/Discard
│   │   │   ├── settingsTabs.ts  # Core settings tab manifest contributions
│   │   │   └── manifest.ts  # Module registration for app shell
│   │   │   └── routes.tsx  # /settings → SettingsPage
│   │   └── finance/
│   │       ├── README.md  # Finance module manifest
│   │       ├── api.ts  # Finance API client and query keys
│   │       ├── FinanceModuleLayout.tsx  # Module layout with secondary nav
│   │       ├── navItem.tsx  # App nav menu entry
│   │       ├── routes.tsx  # Route manifest
│   │       ├── subNav.tsx  # Transactions · Subscriptions · Vendors · Accounts · Tags tabs
│   │       ├── components/          # finance UI components
│   │       │   ├── FinanceAccountsListView.tsx  # Accounts list table + pagination
│   │       │   ├── FinanceAccountListRow.tsx  # Payment method list row
│   │       │   ├── FinanceListView.tsx  # Transactions list table + pagination
│   │       │   ├── FinanceListRow.tsx  # Transaction list row
│   │       │   ├── FinanceSubscriptionsListView.tsx  # Subscriptions list table + pagination
│   │       │   ├── FinanceSubscriptionListRow.tsx  # Subscription list row
│   │       │   ├── FinanceVendorListRow.tsx  # Vendor list row
│   │       │   ├── FinanceVendorsListView.tsx  # Vendors list table + pagination
│   │       │   ├── FinanceViewToggle.tsx  # Card/list view segmented control
│   │       │   └── …  # cards, detail, tags, media, etc.
│   │       ├── lib/          # finance helpers
│   │       │   ├── obligationListSort.ts  # Subscription list column sort
│   │       │   ├── obligationSearch.ts  # Subscription list search filter
│   │       │   ├── paymentMethodListSort.ts  # Account list column sort
│   │       │   ├── transactionListSort.ts  # Transaction list column sort
│   │       │   ├── transactionSearch.ts  # Transaction and vendor search filters
│   │       │   ├── transactionView.ts  # Transaction page view mode persistence
│   │       │   ├── vendorListSort.ts  # Vendor list column sort
│   │       │   └── vendorView.ts  # Vendor page view mode persistence
│   │       └── pages/          # finance pages
│   │           ├── FinanceAccountsPage.tsx  # Payment methods list
│   │           ├── FinanceTransactionsPage.tsx  # Transactions (kanban or list)
│   │           ├── FinanceSubscriptionsPage.tsx  # Subscriptions + summary
│   │           ├── FinanceVendorsPage.tsx  # Vendors (card grid or list)
│   │           └── …  # create/detail/tag pages
│   │   └── timeline/
│   │       ├── README.md  # Timeline module manifest
│   │       ├── TimelineModuleLayout.tsx  # ModuleSubNavLayout wrapper for timeline routes
│   │       ├── subNav.tsx  # Calendar · Events · Plan · Tags secondary tabs
│   │       ├── api.ts  # Timeline events, plans, calendar feed API client
│   │       ├── components/
│   │       │   ├── browse/
│   │       │   │   ├── TimelineEventsFilters.tsx  # Events list collapsible filters
│   │       │   │   ├── TimelineListRow.tsx  # List table row + row menu
│   │       │   │   └── TimelineListView.tsx  # List table chrome + pagination
│   │       │   ├── calendar/
│   │       │   │   ├── TimelineCalendarEventContent.tsx  # Event chip with contact avatars
│   │       │   │   ├── TimelineCalendarEventHoverPreview.tsx  # Hover tooltip with dates, text, tags, people
│   │       │   │   ├── TimelineCalendarFilters.tsx  # Collapsible tag/people filters
│   │       │   │   ├── TimelineEventCreateModal.tsx  # Calendar day-view create dialog
│   │       │   │   ├── TimelineEventEditModal.tsx  # Calendar event edit dialog
│   │       │   │   ├── TimelineFullCalendar.tsx  # FullCalendar wrapper
│   │       │   │   └── timeline-calendar.css  # Calendar theme + plan-item styling
│   │       │   ├── forms/
│   │       │   │   ├── TimelineEventEditorPanel.tsx  # Shared page/modal editor shell
│   │       │   │   ├── TimelineEventForm.tsx  # Shared create/detail fields
│   │       │   │   ├── TimelineEventRemindersField.tsx  # Reminder offset rows
│   │       │   │   └── TimelineFormPageLayout.tsx  # Form page chrome
│   │       │   ├── filters/
│   │       │   │   ├── TimelineEventFilterFields.tsx  # Shared tag/people/query filter fields
│   │       │   │   └── TimelineFiltersPanel.tsx  # Collapsible filter panel shell
│   │       │   ├── plans/
│   │       │   │   ├── TimelinePlanForm.tsx  # Plan detail fields
│   │       │   │   ├── TimelinePlanItemEditorModal.tsx  # Plan item create/edit modal
│   │       │   │   ├── TimelinePlanItemForm.tsx  # Plan item fields + promote/delete
│   │       │   │   ├── TimelinePlanItemAddRow.tsx  # Bottom add row for plan items list
│   │       │   │   ├── TimelinePlanItemListRow.tsx  # Plan items table row
│   │       │   │   ├── TimelinePlanItemScheduleCellPopover.tsx  # Schedule column inline editor
│   │       │   │   ├── TimelinePlanItemsListView.tsx  # Plan items embedded list
│   │       │   │   ├── TimelinePlanListRow.tsx  # Plans list table row
│   │       │   │   └── TimelinePlansListView.tsx  # Plans list table
│   │       │   ├── tags/
│   │       │   │   ├── TimelineEventInlineTags.tsx  # Inline tag picker on event forms
│   │       │   │   ├── TimelineTagListRow.tsx  # Tags list table row with inline edit
│   │       │   │   ├── TimelineTagsListView.tsx  # Tags list table + pagination
│   │       │   │   ├── TimelineTagPill.tsx  # Colored tag pill
│   │       │   │   └── index.ts  # Tags barrel export
│   │       │   ├── ContactMultiSelect.tsx  # Multi-select contact picker
│   │       │   ├── TimelineMediaCarousel.tsx  # Re-exports EntityMediaCarousel for timeline forms
│   │       │   ├── TimelinePeopleAvatars.tsx  # People column avatar row
│   │       │   └── TimelinePersonCircle.tsx  # Single profile circle
│   │       ├── hooks/
│   │       │   ├── useTimelineCalendarRange.ts  # Calendar visible-range state
│   │       │   ├── useTimelineEventCreator.ts  # Shared event create state and mutations
│   │       │   ├── useTimelineEventEditor.ts  # Shared event edit state and mutations
│   │       │   ├── useTimelinePlanEditor.ts  # Plan detail form state and mutations
│   │       │   └── useTimelinePlanItemEditor.ts  # Plan item modal state, promote, delete
│   │       ├── lib/
│   │       │   ├── timelineCalendarEvents.ts  # API row ↔ FullCalendar mapping (events + plan items)
│   │       │   ├── timelineDateRange.ts  # Visible-range query param helpers
│   │       │   ├── timelineDateTime.ts  # Datetime parsing, form values, all-day detection
│   │       │   ├── timelineDisplay.ts  # Date/time range formatting + sort helpers
│   │       │   ├── timelineEventFilters.ts  # Shared filter state for list + calendar
│   │       │   ├── timelinePersonCircle.ts  # Avatar circle label helper
│   │       │   ├── timelinePlanDisplay.ts  # Plan/plan-item list display helpers
│   │       │   ├── timelinePlanItemDefaults.ts  # Default create payload for new plan items
│   │       │   ├── timelineReminderDisplay.ts  # Reminder label formatting
│   │       │   ├── timelineTagDisplay.ts  # Tag pill color helpers
│   │       │   └── timelineTagSearch.ts  # Tag list search + sort helpers
│   │       ├── navItem.tsx  # App nav menu entry
│   │       ├── pages/
│   │       │   ├── TimelineCalendarPage.tsx  # Calendar tab (events + plan items)
│   │       │   ├── TimelineCreatePage.tsx  # New event form
│   │       │   ├── TimelineEventPage.tsx  # Event detail form
│   │       │   ├── TimelinePage.tsx  # Events list hub
│   │       │   ├── TimelinePlanCreatePage.tsx  # New plan form
│   │       │   ├── TimelinePlanDetailPage.tsx  # Plan detail + items
│   │       │   ├── TimelinePlansPage.tsx  # Plans list hub
│   │       │   └── TimelineTagsPage.tsx  # Tags list hub
│   │       ├── homeCards/          # home dashboard card widgets
│   │       │   ├── HomeTodayTimelineCard.tsx  # today events query shell
│   │       │   ├── HomeTodayEvents.tsx  # today's events list UI
│   │       │   └── lib/
│   │       │       └── homeTodayEvents.ts  # today filter, sort, time labels
│   │       ├── homeCards.ts  # Timeline dashboard card manifest contributions
│   │       ├── manifest.ts  # Module registration for app shell
│   │       └── routes.tsx  # /timeline routes (events, calendar, plan, tags)
│   │   └── journal/
│   │       ├── README.md  # Journal module manifest
│   │       ├── JournalModuleLayout.tsx  # ModuleSubNavLayout wrapper for journal routes
│   │       ├── subNav.tsx  # Entries · Tags secondary tabs
│   │       ├── api.ts  # Journal entries and entry media API client
│   │       ├── components/
│   │       │   ├── browse/
│   │       │   │   ├── JournalFilters.tsx  # Entries list collapsible filters
│   │       │   │   ├── JournalListRow.tsx  # List table row + row menu
│   │       │   │   └── JournalListView.tsx  # List table chrome + pagination
│   │       │   ├── filters/
│   │       │   │   ├── JournalFilterFields.tsx  # Tag/query/date filter fields
│   │       │   │   └── JournalFiltersPanel.tsx  # Collapsible filter panel shell
│   │       │   ├── forms/
│   │       │   │   ├── JournalEntryForm.tsx  # Shared create/detail fields
│   │       │   │   └── JournalFormPageLayout.tsx  # Form page chrome
│   │       │   └── tags/
│   │       │       ├── JournalInlineTags.tsx  # Inline tag picker on entry forms
│   │       │       ├── JournalTagListRow.tsx  # Tags list table row with inline edit
│   │       │       ├── JournalTagsListView.tsx  # Tags list table + pagination
│   │       │       ├── JournalTagPill.tsx  # Colored tag pill
│   │       │       └── index.ts  # Tags barrel export
│   │       ├── hooks/
│   │       │   └── useJournalEntryEditor.ts  # Entry edit state, media queue, and mutations
│   │       ├── lib/
│   │       │   ├── journalDisplay.ts  # Date formatting + content preview truncation
│   │       │   ├── journalFilters.ts  # Shared filter state for list
│   │       │   ├── journalTagDisplay.ts  # Tag pill color helpers
│   │       │   └── journalTagSearch.ts  # Tag list search + sort helpers
│   │       ├── navItem.tsx  # App nav menu entry
│   │       ├── pages/
│   │       │   ├── JournalCreatePage.tsx  # New entry form
│   │       │   ├── JournalEntryPage.tsx  # Entry detail form
│   │       │   ├── JournalPage.tsx  # Entries list hub
│   │       │   └── JournalTagsPage.tsx  # Tags list hub
│   │       ├── homeCards/          # home dashboard card widgets
│   │       │   ├── HomeJournalStatusCard.tsx  # today entry query shell
│   │       │   ├── HomeJournalStatus.tsx  # completion checkmark UI
│   │       │   └── lib/
│   │       │       ├── homeJournalToday.ts  # today filled check
│   │       │       └── homeJournalStreak.ts  # consecutive-day streak calc
│   │       ├── homeCards.ts  # Journal dashboard card manifest contributions
│   │       ├── manifest.ts  # Module registration for app shell
│   │       └── routes.tsx  # /journal routes
│   │   └── services/
│   │       ├── README.md  # Services module manifest
│   │       ├── ServicesModuleLayout.tsx  # AppShellContent + max-w-6xl wrapper
│   │       ├── api.ts  # Services CRUD + check-now API client
│   │       ├── navItem.tsx  # App nav menu entry
│   │       ├── manifest.ts  # Module registration for app shell
│   │       ├── routes.tsx  # /services routes
│   │       ├── components/
│   │       │   ├── ServiceForm.tsx  # Create/edit fields + probe readout
│   │       │   ├── ServiceFormPageLayout.tsx  # Form header with Save/Discard
│   │       │   ├── ServicesListRow.tsx  # List row + status dot + row menu
│   │       │   ├── ServicesListView.tsx  # List table chrome
│   │       │   └── ServiceStatusDot.tsx  # Glowing up/caution/down indicator
│   │       ├── hooks/
│   │       │   └── useServiceEditor.ts  # Detail edit state and mutations
│   │       ├── lib/
│   │       │   ├── serviceDisplay.ts  # Timestamps, status dot classes, form helpers
│   │       │   └── serviceListSort.ts  # Sortable column accessors + default sort
│   │       └── pages/
│   │           ├── ServiceCreatePage.tsx  # New service form
│   │           ├── ServiceDetailPage.tsx  # Edit service form
│   │           └── ServicesPage.tsx  # Services list hub
│   │   └── jobs/
│   │       ├── README.md  # Jobs module manifest
│   │       ├── JobsModuleLayout.tsx  # ModuleSubNavLayout wrapper
│   │       ├── subNav.tsx  # Runs · Schedules · Tasks secondary tabs
│   │       ├── api.ts  # Job runs and schedules API client
│   │       ├── components/
│   │       │   ├── runs/
│   │       │   │   ├── JobRunDetailModal.tsx  # Read-only run detail modal
│   │       │   │   ├── JobRunsListRow.tsx  # Runs list table row
│   │       │   │   └── JobRunsListView.tsx  # Runs list table + pagination
│   │       │   ├── schedules/
│   │       │   │   ├── JobScheduleForm.tsx  # Create/edit schedule form fields
│   │       │   │   ├── JobScheduleFormPageLayout.tsx  # Form header with Save/Discard
│   │       │   │   ├── JobSchedulesListRow.tsx  # Schedules list row + menu
│   │       │   │   ├── JobSchedulesListView.tsx  # Schedules list + pagination
│   │       │   │   ├── ScheduleNextRunCell.tsx  # Next run timestamp + countdown pill
│   │       │   │   └── ScheduleRunCountCell.tsx  # Run count pill
│   │       │   └── tasks/
│   │       │       ├── JobTaskDetailModal.tsx  # Read-only task detail modal
│   │       │       ├── JobTasksListRow.tsx  # Tasks list table row
│   │       │       └── JobTasksListView.tsx  # Tasks list table
│   │       ├── hooks/
│   │       │   └── useTickingNow.ts  # Shared 1s clock for live countdowns
│   │       ├── lib/
│   │       │   ├── jobRunDisplay.ts  # Run status labels, timestamps, sort accessors
│   │       │   ├── jobScheduleDisplay.ts  # Schedule summary + form helpers
│   │       │   ├── jobTaskDisplay.ts  # Task catalog labels, sort accessors
│   │       │   └── jobTimeDisplay.ts  # Shared timestamp formatting
│   │       ├── navItem.tsx  # App nav menu entry
│   │       ├── pages/
│   │       │   ├── JobRunsPage.tsx  # Runs list hub
│   │       │   ├── JobScheduleFormPage.tsx  # Schedule create/edit form page
│   │       │   ├── JobSchedulesPage.tsx  # Schedules list hub
│   │       │   └── JobTasksPage.tsx  # Tasks catalog hub
│   │       ├── manifest.ts  # Module registration for app shell
│   │       └── routes.tsx  # /jobs routes
│   ├── styles/
│   │   └── themes.css  # Theme CSS variables per app theme
│   └── vite-env.d.ts  # Vite client type references
├── tailwind.config.js  # Tailwind theme and content paths
├── tsconfig.json  # TypeScript app config
├── tsconfig.node.json  # TypeScript config for Vite/Node
└── vite.config.ts  # Vite dev server and build config
```

## Excluded (production)

`modules/dev/` is registered only when `import.meta.env.DEV` is true — not shipped in production builds. No `modules/devtools/`, `modules/scripts/`, or `modules/preferences/` (merged into `settings/`).
