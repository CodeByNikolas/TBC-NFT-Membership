import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";

interface AddNFTCardProps {
  onClick?: () => void;
}

export function AddNFTCard({ onClick }: AddNFTCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square relative overflow-hidden border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors" onClick={onClick}>
        <PlusIcon className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500 font-medium">Add New NFT</p>
      </div>
      <CardFooter className="p-4 pt-3 opacity-0 pointer-events-none">
        <div className="flex space-x-2 w-full">
          <div className="flex-1 h-9"></div>
          <div className="flex-1 h-9"></div>
        </div>
      </CardFooter>
    </Card>
  );
} 