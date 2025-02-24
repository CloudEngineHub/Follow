import {
  MasonryIntersectionContext,
  useMasonryItemRatio,
  useMasonryItemWidth,
  useSetStableMasonryItemRatio,
} from "@follow/components/ui/masonry/contexts.jsx"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { FeedViewType } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import type { PropsWithChildren } from "react"
import { memo, useContext, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { SwipeMedia } from "~/components/ui/media/SwipeMedia"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { filterSmallMedia } from "~/lib/utils"
import { EntryContent } from "~/modules/entry-content"
import { useEntry } from "~/store/entry/hooks"
import { useImageDimensions } from "~/store/image"

import { usePreviewMedia } from "../../../components/ui/media/hooks"
import { EntryItemWrapper } from "../layouts/EntryItemWrapper"
import { GridItem, GridItemFooter } from "../templates/grid-item-template"
import type { UniversalItemProps } from "../types"

export function PictureItem({ entryId, entryPreview, translation }: UniversalItemProps) {
  const entry = useEntry(entryId) || entryPreview

  const isActive = useRouteParamsSelector(({ entryId }) => entryId === entry?.entries.id)

  const { t } = useTranslation()
  const entryContent = useMemo(() => <EntryContent entryId={entryId} noMedia compact />, [entryId])
  const previewMedia = usePreviewMedia(entryContent)
  if (!entry) return null
  return (
    <GridItem entryId={entryId} entryPreview={entryPreview} translation={translation}>
      <div className="relative flex gap-2 overflow-x-auto">
        {entry.entries.media ? (
          <SwipeMedia
            media={entry.entries.media}
            className={cn(
              "aspect-square",
              "w-full shrink-0 rounded-md [&_img]:rounded-md",
              isActive && "rounded-b-none",
            )}
            imgClassName="object-cover"
            onPreview={(media, i) => {
              previewMedia(media, i)
            }}
          />
        ) : (
          <div className="center aspect-square w-full flex-col gap-1 rounded-md bg-muted text-xs text-muted-foreground">
            <i className="i-mgc-sad-cute-re size-6" />
            {t("entry_content.no_content")}
          </div>
        )}
      </div>
    </GridItem>
  )
}

const proxySize = {
  width: 600,
  height: 0,
}

export const PictureWaterFallItem = memo(function PictureWaterFallItem({
  entryId,
  entryPreview,
  translation,
  index,
  className,
}: UniversalItemProps & { index: number; className?: string }) {
  const entry = useEntry(entryId) || entryPreview

  const isActive = useRouteParamsSelector(({ entryId }) => entryId === entry?.entries.id)
  const entryContent = useMemo(() => <EntryContent entryId={entryId} noMedia compact />, [entryId])
  const previewMedia = usePreviewMedia(entryContent)
  const itemWidth = useMasonryItemWidth()

  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const intersectionObserver = useContext(MasonryIntersectionContext)

  useEffect(() => {
    if (!ref || !intersectionObserver) return

    intersectionObserver.observe(ref)

    return () => {
      intersectionObserver.unobserve(ref)
    }
  }, [ref, intersectionObserver])

  const media = useMemo(() => filterSmallMedia(entry?.entries.media || []), [entry?.entries.media])

  if (media?.length === 0) return null
  if (!entry) return null

  return (
    <div ref={setRef} data-entry-id={entryId} data-index={index} className={className}>
      <EntryItemWrapper
        view={FeedViewType.Pictures}
        entry={entry}
        itemClassName="group rounded-md overflow-hidden"
        style={{
          width: itemWidth,
        }}
      >
        {media && media.length > 0 ? (
          <MasonryItemFixedDimensionWrapper url={media[0]!.url}>
            <SwipeMedia
              media={media}
              className={cn(
                "w-full grow rounded-md after:pointer-events-none after:absolute after:inset-0 after:bg-transparent after:transition-colors after:duration-300 group-hover:after:bg-black/20",
                isActive && "rounded-b-none",
              )}
              proxySize={proxySize}
              imgClassName="object-cover"
              onPreview={previewMedia}
            />

            <div className="z-[3] shrink-0 overflow-hidden rounded-b-md pb-1">
              <GridItemFooter
                entryId={entryId}
                entryPreview={entryPreview}
                translation={translation}
              />
            </div>
          </MasonryItemFixedDimensionWrapper>
        ) : (
          <div className="center aspect-video flex-col gap-1 rounded-md bg-muted text-xs text-muted-foreground">
            <i className="i-mgc-sad-cute-re size-6" />
            No media available
          </div>
        )}
      </EntryItemWrapper>
    </div>
  )
})

const MasonryItemFixedDimensionWrapper = (
  props: PropsWithChildren<{
    url: string
  }>,
) => {
  const { url, children } = props
  const dim = useImageDimensions(url)
  const itemWidth = useMasonryItemWidth()

  const itemHeight = dim ? itemWidth / dim.ratio : itemWidth
  const stableRadio = useState(() => itemWidth / itemHeight || 1)[0]
  const setItemStableRatio = useSetStableMasonryItemRatio()

  const stableRadioCtx = useMasonryItemRatio(url)

  useEffect(() => {
    setItemStableRatio(url, stableRadio)
  }, [setItemStableRatio, stableRadio, url])

  const style = useMemo(
    () => ({
      width: itemWidth,
      height: itemWidth / stableRadioCtx! + 60,
    }),
    [itemWidth, stableRadioCtx],
  )

  if (!style.height) return null

  return (
    <div className="relative flex h-full flex-col overflow-x-auto overflow-y-hidden" style={style}>
      {children}
    </div>
  )
}

MasonryItemFixedDimensionWrapper.whyDidYouRender = {
  logOnDifferentValues: true,
}

export const PictureItemSkeleton = (
  <div className="relative max-w-md rounded-md bg-theme-background text-zinc-700 transition-colors dark:text-neutral-400">
    <div className="relative">
      <div className="p-1.5">
        <div className="relative flex gap-2 overflow-x-auto">
          <div className="relative flex aspect-square w-full shrink-0 items-center overflow-hidden rounded-md">
            <Skeleton className="size-full overflow-hidden" />
          </div>
        </div>
        <div className="relative flex-1 px-2 pb-3 pt-1 text-sm">
          <div className="relative mb-1 mt-1.5 truncate font-medium leading-none">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-1 flex items-center gap-1 truncate text-[13px]">
            <Skeleton className="mr-0.5 size-4" />
            <Skeleton className="h-3 w-1/2" />
            <span className="text-zinc-500">·</span>
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  </div>
)
