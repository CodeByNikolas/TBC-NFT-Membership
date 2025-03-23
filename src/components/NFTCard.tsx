import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

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
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardHeader className="p-4 pb-0">
        <h3 className="font-bold truncate">{name}</h3>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-0 flex-grow">
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-3 flex space-x-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => onEdit && onEdit(id)}
        >
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => onView && onView(id)}
        >
          View
        </Button>
      </CardFooter>
    </Card>
  );
} 