import React from "react";
import { Chip } from "@nextui-org/react";

const ClearanceBadge = ({ isCleared, clearanceType }) => {
  if (!isCleared) {
    return (
      <Chip color="warning" variant="faded" size="sm">
        ⚠️ Clearance Required
      </Chip>
    );
  }

  let label = "Cleared";
  if (clearanceType === 1) label = "✅ Accredited Investor";
  else if (clearanceType === 2) label = "✅ Qualified Purchaser";
  else if (clearanceType === 3) label = "✅ Non-US Person";

  return (
    <Chip color="success" variant="flat" size="sm">
      {label}
    </Chip>
  );
};

export default ClearanceBadge;
