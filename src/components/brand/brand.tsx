import type { TypeBrand } from "#/api/Common";
import { getBrandImageSrc } from "#/lib/brand-image";
import { useEffect, useMemo, useState } from "react";

export const Brand = ({ brand, productCount }: { brand: TypeBrand; productCount?: number }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const brandImageSrc = useMemo(() => getBrandImageSrc(brand?.brandImage), [brand]);
  const showBrandImage = Boolean(brand && brandImageSrc && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [brandImageSrc]);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
      {brand ? (
        <div className="mt-2 space-y-2">
          {showBrandImage ? (
            <img
              src={brandImageSrc ?? undefined}
              alt={`${brand.brandName} logo`}
              className="h-10 w-auto rounded-sm border border-slate-200 bg-white p-1"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : null}
          <p>
            {brand.brandName} ({brand.brandCode})
          </p>
          {productCount ? (
            <p className="font-medium text-slate-900">Products ({productCount})</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-1 text-slate-500">No brand linked</p>
      )}
    </div>
  );
};
