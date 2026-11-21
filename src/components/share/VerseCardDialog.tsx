import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CARD_SIZE_LABEL, CARD_SIZES, CARD_STYLE_LABEL, canvasToBlob, drawCard, type CardSize, type CardStyle } from "@/lib/share/card";

/** A verse as a picture, drawn in the browser: nothing is uploaded. */
export function VerseCardDialog({ open, onOpenChange, text, reference, translation }: { open: boolean; onOpenChange: (o: boolean) => void; text: string; reference: string; translation: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [style, setStyle] = useState<CardStyle>("day");
  const [size, setSize] = useState<CardSize>("square");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    // wait for the dialog to mount the canvas
    const t = setTimeout(() => {
      if (!canvas.current) return;
      drawCard(canvas.current, { text, reference, translation, style, size }).then(
        () => alive && setError(false),
        () => alive && setError(true),
      );
    }, 30);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [open, text, reference, translation, style, size]);

  const fileName = `${reference.replace(/[^A-Za-z0-9]+/g, "-").replace(/-$/, "")}-${size}.png`;
  const download = async () => {
    if (!canvas.current) return;
    const blob = await canvasToBlob(canvas.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    toast.success("Image saved");
  };
  const share = async () => {
    if (!canvas.current) return;
    const blob = await canvasToBlob(canvas.current);
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      await navigator.share({ files: [file], title: reference });
    } catch (e) {
      if ((e as Error).name !== "AbortError") await download();
    }
  };
  const canShareFiles = typeof navigator !== "undefined" && "canShare" in navigator && (() => { try { return navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] }); } catch { return false; } })();
  const [w, h] = CARD_SIZES[size];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Make a verse card</DialogTitle>
          <DialogDescription>Save {reference} as a picture to share. It is drawn on your device.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label id="card-style">Look</Label>
            <ToggleGroup type="single" variant="outline" size="sm" value={style} onValueChange={(v) => v && setStyle(v as CardStyle)} aria-labelledby="card-style" className="justify-start">
              {(Object.keys(CARD_STYLE_LABEL) as CardStyle[]).map((s) => <ToggleGroupItem key={s} value={s}>{CARD_STYLE_LABEL[s]}</ToggleGroupItem>)}
            </ToggleGroup>
          </div>
          <div className="grid gap-1.5">
            <Label id="card-size">Shape</Label>
            <ToggleGroup type="single" variant="outline" size="sm" value={size} onValueChange={(v) => v && setSize(v as CardSize)} aria-labelledby="card-size" className="justify-start flex-wrap">
              {(Object.keys(CARD_SIZE_LABEL) as CardSize[]).map((s) => <ToggleGroupItem key={s} value={s}>{CARD_SIZE_LABEL[s]}</ToggleGroupItem>)}
            </ToggleGroup>
          </div>
          <div className="grid place-items-center rounded-md border bg-wash p-2">
            <canvas ref={canvas} role="img" aria-label={`Preview of the verse card for ${reference}`} data-testid="card-canvas" data-w={w} data-h={h} className="max-h-[48dvh] w-auto max-w-full rounded-sm shadow-sm" />
          </div>
          {error && <p className="text-sm text-destructive">The picture could not be drawn in this browser.</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={download}><Download aria-hidden="true" /> Save picture</Button>
            {canShareFiles && <Button variant="outline" onClick={share}><Share2 aria-hidden="true" /> Share</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
