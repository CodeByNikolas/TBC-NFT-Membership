import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";

interface NFTData {
  id: number;
  name: string;
  image: string;
  description?: string;
  attributes?: any[];
  isLoading?: boolean;
}

interface NFTListViewProps {
  nfts: NFTData[];
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onAdd?: () => void;
}

export function NFTListView({ nfts, onEdit, onView, onAdd }: NFTListViewProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 py-3 px-4 font-medium text-sm text-gray-500 border-b">
        <div className="col-span-1">ID</div>
        <div className="col-span-1">Image</div>
        <div className="col-span-4">Name</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2">Actions</div>
      </div>
      
      {nfts.map((nft) => (
        <div key={nft.id} className="grid grid-cols-12 py-3 px-4 items-center bg-white border rounded-md shadow-sm hover:shadow-md transition-shadow">
          <div className="col-span-1 font-mono text-sm">{nft.id}</div>
          <div className="col-span-1 relative h-10 w-10">
            <Image 
              src={nft.image} 
              alt={nft.name} 
              fill
              className="rounded-md object-cover"
              sizes="40px"
            />
            {nft.isLoading && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="col-span-4 font-medium truncate flex items-center">
            {nft.name}
            {nft.isLoading && <Loader2 className="ml-2 w-3 h-3 text-gray-400 animate-spin" />}
          </div>
          <div className="col-span-4 text-sm text-gray-500 truncate">{nft.description || '-'}</div>
          <div className="col-span-2 flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(nft.id)}
              disabled={nft.isLoading}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onView(nft.id)}
              disabled={nft.isLoading}
            >
              View
            </Button>
          </div>
        </div>
      ))}
      
      {onAdd && (
        <Button 
          className="w-full py-6 border-dashed border-2 shadow-none hover:shadow-sm bg-transparent text-gray-500 hover:bg-gray-50"
          variant="outline"
          onClick={onAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New NFT
        </Button>
      )}
    </div>
  );
} 