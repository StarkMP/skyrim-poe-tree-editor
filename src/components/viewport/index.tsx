import { ZoomPanWrapper } from '@/components/ui/zoom-pan-wrapper';

export const Viewport = () => (
  <ZoomPanWrapper className="bg-[#080B10]" maxScale={2}>
    <span className="text-white">
      Вместо этого span, должны быть ноды и фоновые изображения (пое ветка)
    </span>
  </ZoomPanWrapper>
);
