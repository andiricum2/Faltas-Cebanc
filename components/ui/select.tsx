import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

type ParsedOption = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string | null;
};

function parseChildrenToOptions(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const childType: any = child.type as any;
    const isOptgroup = typeof childType === "string" && childType.toLowerCase() === "optgroup";
    const isOption = typeof childType === "string" && childType.toLowerCase() === "option";

    if (isOptgroup) {
      const cprops = (child as React.ReactElement<any>).props as any;
      const groupLabel = (cprops?.label as string) ?? null;
      React.Children.forEach(cprops?.children, (grand) => {
        if (!React.isValidElement(grand)) return;
        const gt: any = grand.type as any;
        if (typeof gt === "string" && gt.toLowerCase() === "option") {
          const gprops = (grand as React.ReactElement<any>).props as any;
          const value = String(gprops?.value ?? "");
          const label = String(gprops?.children ?? value);
          const disabled = !!gprops?.disabled;
          options.push({ value, label, disabled, group: groupLabel });
        }
      });
      return;
    }

    if (isOption) {
      const cprops = (child as React.ReactElement<any>).props as any;
      const value = String(cprops?.value ?? "");
      const label = String(cprops?.children ?? value);
      const disabled = !!cprops?.disabled;
      options.push({ value, label, disabled, group: null });
    }
  });
  return options;
}

type RenderItem =
  | { kind: "group"; label: string }
  | { kind: "option"; option: ParsedOption };

function buildRenderItems(children: React.ReactNode): RenderItem[] {
  const items: RenderItem[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const childType: any = child.type as any;
    const isOptgroup = typeof childType === "string" && childType.toLowerCase() === "optgroup";
    const isOption = typeof childType === "string" && childType.toLowerCase() === "option";

    if (isOptgroup) {
      const cprops = (child as React.ReactElement<any>).props as any;
      const groupLabel = (cprops?.label as string) ?? "";
      if (groupLabel) items.push({ kind: "group", label: groupLabel });
      React.Children.forEach(cprops?.children, (grand) => {
        if (!React.isValidElement(grand)) return;
        const gt: any = grand.type as any;
        if (typeof gt === "string" && gt.toLowerCase() === "option") {
          const gprops = (grand as React.ReactElement<any>).props as any;
          const value = String(gprops?.value ?? "");
          const label = String(gprops?.children ?? value);
          const disabled = !!gprops?.disabled;
          items.push({ kind: "option", option: { value, label, disabled, group: groupLabel } });
        }
      });
      return;
    }

    if (isOption) {
      const cprops = (child as React.ReactElement<any>).props as any;
      const value = String(cprops?.value ?? "");
      const label = String(cprops?.children ?? value);
      const disabled = !!cprops?.disabled;
      items.push({ kind: "option", option: { value, label, disabled, group: null } });
    }
  });
  return items;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onChange, value, defaultValue, disabled, ...props }, ref) => {
    const nativeRef = React.useRef<HTMLSelectElement | null>(null);
    const mergedRef = React.useCallback((node: HTMLSelectElement | null) => {
      nativeRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref && typeof ref === "object") (ref as any).current = node;
    }, [ref]);

    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const [popupStyle, setPopupStyle] = React.useState<React.CSSProperties>({});
    const dropdownRef = React.useRef<HTMLDivElement | null>(null);

    const parsed = React.useMemo(() => parseChildrenToOptions(children), [children]);
    const renderItems = React.useMemo(() => buildRenderItems(children), [children]);

    const findLabel = React.useCallback((val: string | number | readonly string[] | undefined): string => {
      if (val === undefined || val === null) return "";
      const str = Array.isArray(val) ? val[0] : String(val);
      const match = parsed.find((o) => o.value === str);
      return match ? match.label : String(str ?? "");
    }, [parsed]);

    const selectedLabel = findLabel(value ?? defaultValue as any);

    React.useEffect(() => {
      setMounted(true);
      const onDocClick = (e: MouseEvent) => {
        const target = e.target as Node | null;
        const inTrigger = containerRef.current?.contains(target as Node) ?? false;
        const inDropdown = dropdownRef.current?.contains(target as Node) ?? false;
        if (!inTrigger && !inDropdown) {
          setOpen(false);
        }
      };
      const onEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onEsc);
      };
    }, []);

    const updatePopupPosition = React.useCallback(() => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const optionsCount = renderItems.filter((it) => it.kind === "option").length;
      const dropdownHeight = Math.min(320, Math.max(40, optionsCount * 36 + 12));
      const spaceBelow = viewportHeight - rect.bottom;
      const openUpwards = spaceBelow < dropdownHeight + 8;
      const top = openUpwards ? rect.top - dropdownHeight - 8 : rect.bottom + 4;
      setPopupStyle({
        position: "fixed",
        top,
        left: rect.left,
        width: rect.width,
        maxHeight: dropdownHeight,
      });
    }, [renderItems]);

    React.useEffect(() => {
      if (!open) return;
      updatePopupPosition();
      const onScroll = () => updatePopupPosition();
      const onResize = () => updatePopupPosition();
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onResize);
      };
    }, [open, updatePopupPosition]);

    const emitChange = (nextValue: string) => {
      if (nativeRef.current) nativeRef.current.value = nextValue;
      // Call consumer onChange with a minimal event-like object
      const synthetic = { target: { value: nextValue } } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange?.(synthetic);
    };

    const handleSelect = (opt: ParsedOption) => {
      if (opt.disabled) return;
      emitChange(opt.value);
      setOpen(false);
    };

    const currentValueStr = value !== undefined ? String(value) : (defaultValue !== undefined ? String(defaultValue as any) : "");

    return (
      <div ref={containerRef} className="relative">
        {/* Visually hidden native select for forms and accessibility fallback */}
        <select
          ref={mergedRef}
          value={value as any}
          defaultValue={defaultValue as any}
          onChange={onChange}
          disabled={disabled}
          aria-hidden
          tabIndex={-1}
          className="sr-only"
          {...props}
        >
          {children}
        </select>

        {/* Styled trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          ref={triggerRef}
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("block truncate", !currentValueStr && "text-muted-foreground")}>
            {selectedLabel || "Selecciona una opción"}
          </span>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
        </button>

        {/* Dropdown */}
        {open && mounted ? (
          createPortal(
            <div ref={dropdownRef} style={popupStyle} className="z-[9999] overflow-hidden rounded-md border border-input bg-popover shadow-md">
              <ul className="max-h-80 overflow-auto py-1 text-sm">
              {renderItems.filter(it => it.kind === "option").length === 0 ? (
                <li className="px-3 py-2 text-muted-foreground">Sin opciones</li>
              ) : (
                renderItems.map((item, idx) => {
                  if (item.kind === "group") {
                    return (
                      <li key={"group-" + idx} className="sticky top-0 z-10">
                        <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60">
                          {item.label}
                        </div>
                      </li>
                    );
                  }
                  const opt = item.option;
                  const isSelected = String(opt.value) === currentValueStr;
                  return (
                    <li key={(opt.group ?? "") + "::" + opt.value}>
                      <button
                        type="button"
                        disabled={!!opt.disabled}
                        onClick={() => handleSelect(opt)}
                        className={cn(
                          "flex w-full items-center px-3 py-2 text-left hover:bg-accent focus:bg-accent",
                          isSelected ? "bg-accent/60" : undefined,
                          opt.disabled ? "opacity-50 cursor-not-allowed" : undefined
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                      </button>
                    </li>
                  );
                })
              )}
              </ul>
            </div>,
            document.body
          )
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";


