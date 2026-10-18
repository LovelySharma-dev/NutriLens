import LegalPage from '../components/LegalPage';

export default function CopyrightPage() {
  return (
    <LegalPage kicker="Copyright notice" title="Copyright">
      <p>© {new Date().getFullYear()} Lovely Sharma. NutriLens interface, original copy, and this prototype’s arrangement.</p>
      <h2>What this notice covers</h2>
      <p>
        The screens, the wording written for NutriLens, and the way this prototype puts a label photo next to a portion table are original to this project. You may read them as part of using the prototype.
      </p>
      <h2>What stays with others</h2>
      <ul>
        <li>Open Food Facts product records stay under the licence published by Open Food Facts. A barcode result is their data, shown here so you can compare it with the packet.</li>
        <li>Nutri-Score and the nutrition-grade field used in training belong to their authors. This prototype does not claim ownership of that scale.</li>
        <li>Third-party libraries keep their own licences.</li>
      </ul>
      <h2>Not an approval</h2>
      <p>
        This notice describes what belongs to the prototype. It is not a regulatory approval, a filing, or a claim that a food was cleared.
      </p>
      <h2>A reading, not a copy of the packet</h2>
      <p>
        The nutrition table on screen is an extraction. If it disagrees with the printed label, the printed label is the record. Do not republish an extracted table as if it were the manufacturer’s artwork.
      </p>
    </LegalPage>
  );
}
