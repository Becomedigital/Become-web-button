import BancoBogotaLogo from "./brand-logos/logo_adl.png";
import BancoAvVillasLogo from "./brand-logos/banco_avvillas.png";
import BancoPopularLogo from "./brand-logos/banco_popular.png";
import BancoOccidenteLogo from "./brand-logos/banco_occidente.png";
import AdlLogo from "./brand-logos/logo_adl.png";
import DefaultLogo from "./logo192.jpg";

export const BRAND_MAP = {
  bbog: {
    logo: BancoBogotaLogo,
    colors: {
      primary: "#0038FF",
    },
    layout: {
      radiusButton: "16px",
    },
  },
  bavv: {
    logo: BancoAvVillasLogo,
    colors: {
      primary: "#E00328",
    },
    layout: {
      radiusButton: "32px",
    },
  },
  bpop: {
    logo: BancoPopularLogo,
    colors: {
      primary: "#27C112",
    },
    layout: {
      radiusButton: "4px",
    },
  },
  bocc: {
    logo: BancoOccidenteLogo,
    colors: {
      primary: "#0281FE",
    },
    layout: {
      radiusButton: "9999px",
    },
  },
  adl: {
    logo: AdlLogo,
    colors: {
      primary: "#4547EF",
    },
    layout: {
      radiusButton: "32px",
    },
  },
  default: {
    logo: DefaultLogo,
    colors: {
      primary: "#00B257", // Original brand-green
    },
    layout: {
      radiusButton: "4px",
    },
  },
};

export const getBrandConfig = (brandName) => {
  if (!brandName || !BRAND_MAP[brandName.toLowerCase()]) {
    return BRAND_MAP.default;
  }
  return BRAND_MAP[brandName.toLowerCase()];
};
