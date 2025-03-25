import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NetworkToggleProps {
  showAllNetworks: boolean;
  setShowAllNetworks: (show: boolean) => void;
}

export function NetworkToggle({ showAllNetworks, setShowAllNetworks }: NetworkToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="network-toggle" 
        checked={showAllNetworks}
        onCheckedChange={setShowAllNetworks}
      />
      <Label htmlFor="network-toggle">
        {showAllNetworks ? "Showing all networks" : "Showing current network only"}
      </Label>
    </div>
  );
} 