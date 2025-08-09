import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  TableSortLabel,
  Box,
  Chip
} from '@mui/material';
import { Send as SendIcon, Drafts as DraftsIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const DocumentList = ({ 
  documents, 
  headCells,
  onRowClick,
  onRowDoubleClick
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {headCells.map((headCell) => (
              <TableCell key={headCell.id}>
                {headCell.sortable ? (
                  <TableSortLabel>
                    {headCell.label}
                  </TableSortLabel>
                ) : (
                  headCell.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((doc) => (
            <TableRow 
              key={doc.id}
              hover
              onClick={() => onRowClick(doc)}
              onDoubleClick={() => onRowDoubleClick(doc)}
              sx={{ 
                cursor: 'pointer',
                backgroundColor: doc.status === 'Отправлен' ? '#f5f5f5' : 'inherit'
              }}
            >
              {headCells.map((cell) => {
                if (cell.id === 'status') {
                  return (
                    <TableCell key={cell.id}>
                      <Chip 
                        label={doc.status}
                        color={doc.status === 'Отправлен' ? 'success' : 'default'}
                        icon={doc.status === 'Отправлен' ? <SendIcon /> : <DraftsIcon />}
                      />
                    </TableCell>
                  );
                }
                if (cell.id === 'actions') {
                  return <TableCell key={cell.id}>{doc.actions}</TableCell>;
                }
                return <TableCell key={cell.id}>{doc[cell.id]}</TableCell>;
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

DocumentList.propTypes = {
  documents: PropTypes.array.isRequired,
  headCells: PropTypes.array.isRequired,
  onRowClick: PropTypes.func.isRequired,
  onRowDoubleClick: PropTypes.func.isRequired
};

export default DocumentList;