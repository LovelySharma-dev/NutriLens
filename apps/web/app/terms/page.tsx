import LegalPage from '../components/LegalPage';

export default function TermsPage() {
  return (
    <LegalPage kicker="17 October 2026" title="Terms of use">
      <p>
        NutriLens reads a food packet and shows you what it found. These terms cover this prototype. They are written in plain language so you can see the limits before you rely on a number.
      </p>
      <h2>What the product does</h2>
      <ul>
        <li>It photographs or accepts a label image, reads the text, and tries to separate a portion from the per 100 g column.</li>
        <li>It may show a grade, a short explanation, and whether the text overlaps allergens or diet choices you saved.</li>
        <li>A shelf match means the saved preferences did not conflict with the text we have. It is not a medical clearance and it is not a promise the food is safe.</li>
      </ul>
      <h2>What you still check</h2>
      <p>
        OCR misses glare, small type, and curved bottles. A spaced amount such as “9 g” can be split across the photo. Always compare the table on screen with the packet in your hand, including the statutory allergen statement.
      </p>
      <h2>Accounts</h2>
      <p>
        Sign-in is an email and a password kept for this installation. Password reset uses the same reply whether or not the email is registered. When InsForge mail or an SMTP server is configured, the code is emailed. Otherwise it is shown on the reset page for this machine.
      </p>
      <h2>Your photo</h2>
      <p>
        A scan is sent to the NutriLens API you are running. This prototype does not claim a separate cloud archive. Barcode lookup may ask Open Food Facts, and that public record can be incomplete.
      </p>
      <h2>Not an approval</h2>
      <p>
        These terms describe this prototype. They are not a regulatory approval, a filing, or permission to market a food. A grade, a shelf match, and a preference check are readings of the text we have.
      </p>
      <h2>No professional advice</h2>
      <p>
        Nothing here diagnoses a condition, prescribes a diet, or replaces a clinician, a dietitian, or the manufacturer’s declaration.
      </p>
    </LegalPage>
  );
}
