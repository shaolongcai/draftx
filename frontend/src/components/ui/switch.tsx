import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

/**
 * 开关组件（基于 Base UI，样式贴合设置页设计稿）
 * - 关闭：浅色轨道 + 白色描边滑块（居左）
 * - 开启：描边轨道 + 深色 #3A332C 滑块（居右）
 */
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#3A332C]/30",
        // 尺寸
        "data-[size=default]:h-[26px] data-[size=default]:w-[44px]",
        "data-[size=sm]:h-[20px] data-[size=sm]:w-[34px]",
        // 关闭态：浅色轨道 + 细描边
        "data-unchecked:border-[#3A332C]/15 data-unchecked:bg-white/60",
        // 开启态：透明底 + 深色描边
        "data-checked:border-[#3A332C] data-checked:bg-transparent",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full transition-all",
          // 尺寸
          "group-data-[size=default]/switch:size-[20px]",
          "group-data-[size=sm]/switch:size-[14px]",
          // 位置（关闭居左，开启居右）
          "group-data-[size=default]/switch:data-unchecked:translate-x-[2px]",
          "group-data-[size=default]/switch:data-checked:translate-x-[20px]",
          "group-data-[size=sm]/switch:data-unchecked:translate-x-[2px]",
          "group-data-[size=sm]/switch:data-checked:translate-x-[16px]",
          // 颜色（关闭白色带描边，开启深色）
          "data-unchecked:border data-unchecked:border-[#3A332C]/20 data-unchecked:bg-white data-unchecked:shadow-sm",
          "data-checked:bg-[#3A332C]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
