import HomeCarousel from "../components/HomeCarousel";
import { CollectionRow } from "../components/CollectionRow";
import { AboutUsRow } from "../components/AboutUsRow";
import { FeatureStrip } from "../components/FeatureStrip";

export default function Home() {
  return (
    <main>
      <HomeCarousel />
      <CollectionRow />
      <AboutUsRow />
      <FeatureStrip />
    </main>
  );
}
