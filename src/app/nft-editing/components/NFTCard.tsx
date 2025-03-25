import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface NFTCardProps {
  id: number;
  name: string;
  image: string;
  description?: string;
  onEdit?: (id: number) => void;
  onView?: (id: number) => void;
}

export function NFTCard({ id, name, image, description, onEdit, onView }: NFTCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <Image 
          src={image} 
          alt={name}
          fill
          className="object-cover transition-transform hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{name}</h3>
        {description && (
          <p className="text-sm text-gray-500 truncate mt-1">{description}</p>
        )}
        <div className="flex justify-between mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEdit && onEdit(id)}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onView && onView(id)}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 