// src/data/homeCategories.ts
import marbleTray from "../assets/marbleTray.jpg";
import kitchen from "../assets/kitchen.jpg";
import homeDecor from "../assets/homeDecor.jpg";
import office from "../assets/office.jpg";
import sculpture from "../assets/sculpture.jpg";
import bathroom from "../assets/bathroom.jpg";

export const homeCategories = [
  {
    key: "MIND01",
    id: "home_decor",
    category: "home_decor",
    image: homeDecor,
    label: "Home Decor",
    link: "/decorative-products/category/home-decor",
  },
  {
    key: "MIND02",
    id: "storage",
    image: marbleTray,
    label: "Storage",
    link: "/decorative-products/category/storage-organization",
  },
  {
    key: "MIND03",
    id: "kitchen",
    image: kitchen,
    label: "Kitchen",
    link: "/decorative-products/category/kitchen-appliances",
  },
  {
    key: "MIND04",
    id: "office",
    image: office,
    label: "Office",
    link: "/decorative-products/category/office-supplies",
  },
  {
    key: "MIND05",
    id: "bathroom",
    image: bathroom,
    label: "Bathroom",
    link: "/decorative-products/category/bathroom-accessories",
  },
  {
    key: "MIND06",
    id: "sculpture",
    image: sculpture,
    label: "Sculptures & Customization",
    link: "/decorative-products/category/sculptures-customization",
  },
];
