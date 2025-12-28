import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  isBatman = false,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn("text-sm font-medium", isBatman && "text-yellow-400 text-lg font-semibold"),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          isBatman && "text-yellow-400 border-gray-600 hover:bg-gray-700"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: cn(
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          isBatman && "text-yellow-400"
        ),
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          isBatman && "text-yellow-400 hover:bg-gray-700 hover:text-yellow-400"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          isBatman && "bg-yellow-600 text-black hover:bg-yellow-600 hover:text-black"
        ),
        day_today: cn(
          "bg-accent text-accent-foreground",
          isBatman && "bg-gray-700 text-yellow-400"
        ),
        day_outside: cn(
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          isBatman && "text-yellow-400 opacity-50"
        ),
        day_disabled: cn(
          "text-muted-foreground opacity-50",
          isBatman && "text-yellow-400"
        ),
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className={cn("h-4 w-4", isBatman && "text-yellow-400")} />,
        IconRight: ({ ...props }) => <ChevronRight className={cn("h-4 w-4", isBatman && "text-yellow-400")} />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

