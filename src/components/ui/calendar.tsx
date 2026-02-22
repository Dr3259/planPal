"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { zhCN } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rounded-2xl border bg-popover p-3 shadow-xl", className)}
      locale={zhCN}
      classNames={{
        months: "flex flex-col gap-3",
        month: "space-y-2",
        caption: "flex justify-center items-center relative py-1",
        caption_label: "text-sm font-semibold tracking-tight",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-foreground hover:bg-accent/60"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7",
        head_cell:
          "text-muted-foreground flex items-center justify-center text-[0.7rem] font-medium",
        row: "grid grid-cols-7 mt-1",
        cell: "relative flex items-center justify-center p-0",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-full p-0 font-medium text-foreground/90 hover:bg-accent/60"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
        day_today: "bg-primary/10 text-primary font-semibold",
        day_outside:
          "day-outside text-muted-foreground/50 aria-selected:bg-accent/30 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/40 opacity-50",
        day_range_middle:
          "aria-selected:bg-accent/40 aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
