import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface AddNFTCardProps {
  onClick: () => void;
}

export function AddNFTCard({ onClick }: AddNFTCardProps) {
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-gray-700">Add New NFT</h3>
        <p className="text-sm text-gray-500 mt-2">Upload and mint a new token</p>
      </div>
    </Card>
  );
} 