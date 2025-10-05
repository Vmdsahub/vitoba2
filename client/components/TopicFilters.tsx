import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicFiltersProps {
  filterType: "recent" | "likes" | "comments";
  onFilterTypeChange: (type: "recent" | "likes" | "comments") => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

export default function TopicFilters({
  filterType,
  onFilterTypeChange,
  dateRange,
  onDateRangeChange,
}: TopicFiltersProps) {
  const [tempDateRange, setTempDateRange] = useState(dateRange);

  const handleDateRangeApply = () => {
    onDateRangeChange(tempDateRange);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateForCalendar = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00");
  };

  const formatDateFromCalendar = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Ordenar por:
        </Label>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="likes">Mais likes</SelectItem>
            <SelectItem value="comments">Mais comentários</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(filterType === "likes" || filterType === "comments") && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Período para{" "}
                  {filterType === "likes"
                    ? "ordenar por likes"
                    : "ordenar por comentários"}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">
                      Data inicial
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-8 justify-start text-left font-normal",
                            !tempDateRange.start && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempDateRange.start ? (
                            formatDate(tempDateRange.start)
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formatDateForCalendar(tempDateRange.start)}
                          onSelect={(date) =>
                            setTempDateRange({
                              ...tempDateRange,
                              start: formatDateFromCalendar(date),
                            })
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Data final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-8 justify-start text-left font-normal",
                            !tempDateRange.end && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempDateRange.end ? (
                            formatDate(tempDateRange.end)
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formatDateForCalendar(tempDateRange.end)}
                          onSelect={(date) =>
                            setTempDateRange({
                              ...tempDateRange,
                              end: formatDateFromCalendar(date),
                            })
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {filterType === "likes"
                    ? "Tópicos serão ordenados por mais likes no período selecionado"
                    : "Tópicos serão ordenados por mais comentários no período selecionado"}
                </p>
              </div>
              <Button onClick={handleDateRangeApply} className="w-full h-8">
                Aplicar filtro
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
