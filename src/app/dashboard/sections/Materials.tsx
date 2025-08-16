import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Material {
  name: string;
  unit: string;
  requested: number;
  received: number;
}

interface MaterialsProps {
  materials: Material[];
}

export function Materials({ materials }: MaterialsProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="text-blue-600">Materials List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{material.name}</TableCell>
                <TableCell>{material.unit}</TableCell>
                <TableCell>{material.requested}</TableCell>
                <TableCell
                  className={
                    material.received < material.requested
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {material.received}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
