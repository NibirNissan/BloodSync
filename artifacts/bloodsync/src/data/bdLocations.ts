/**
 * Bangladesh administrative geography — 8 divisions and their 64 districts.
 * Source: official Bangladesh Bureau of Statistics division/district list.
 *
 * Used by the Register form and the Find Donors filter to power a cascading
 * Division → District dropdown experience.
 */
export const BD_DIVISIONS: { name: string; bn: string; districts: string[] }[] = [
  {
    name: "Dhaka",
    bn: "ঢাকা",
    districts: [
      "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj",
      "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi",
      "Rajbari", "Shariatpur", "Tangail",
    ],
  },
  {
    name: "Chittagong",
    bn: "চট্টগ্রাম",
    districts: [
      "Bandarban", "Brahmanbaria", "Chandpur", "Chittagong", "Comilla",
      "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali",
      "Rangamati",
    ],
  },
  {
    name: "Khulna",
    bn: "খুলনা",
    districts: [
      "Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna",
      "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira",
    ],
  },
  {
    name: "Rajshahi",
    bn: "রাজশাহী",
    districts: [
      "Bogura", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore",
      "Pabna", "Rajshahi", "Sirajganj",
    ],
  },
  {
    name: "Barisal",
    bn: "বরিশাল",
    districts: [
      "Barguna", "Barisal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur",
    ],
  },
  {
    name: "Sylhet",
    bn: "সিলেট",
    districts: [
      "Habiganj", "Moulvibazar", "Sunamganj", "Sylhet",
    ],
  },
  {
    name: "Rangpur",
    bn: "রংপুর",
    districts: [
      "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
      "Panchagarh", "Rangpur", "Thakurgaon",
    ],
  },
  {
    name: "Mymensingh",
    bn: "ময়মনসিংহ",
    districts: [
      "Jamalpur", "Mymensingh", "Netrokona", "Sherpur",
    ],
  },
];

/** All 64 districts, flat — useful for legacy lookups. */
export const BD_ALL_DISTRICTS: string[] = BD_DIVISIONS.flatMap((d) => d.districts);

/** Lookup: districts for a given division name (English). */
export function districtsForDivision(divisionName: string | null | undefined): string[] {
  if (!divisionName) return [];
  const div = BD_DIVISIONS.find((d) => d.name === divisionName);
  return div ? div.districts : [];
}

/** Reverse lookup: which division does this district belong to? Returns null if unknown. */
export function divisionForDistrict(districtName: string | null | undefined): string | null {
  if (!districtName) return null;
  const div = BD_DIVISIONS.find((d) => d.districts.includes(districtName));
  return div ? div.name : null;
}
