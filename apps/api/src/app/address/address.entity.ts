import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('addresses')
@Index(['x', 'y'])
export class AddressEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) id_fantoir: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) numero: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) rep: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) nom_voie: string | null;
  @Column({ type: 'varchar', length: 16, nullable: true }) code_postal: string | null;
  @Column({ type: 'varchar', length: 16, nullable: true }) code_insee: string | null;
  @Column({ type: 'varchar', length: 128, nullable: true }) nom_commune: string | null;
  @Column({ type: 'varchar', length: 16, nullable: true }) code_insee_ancienne_commune: string | null;
  @Column({ type: 'varchar', length: 128, nullable: true }) nom_ancienne_commune: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) x: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) y: string | null;
  @Column({ type: 'double precision', nullable: true }) lon: number | null;
  @Column({ type: 'double precision', nullable: true }) lat: number | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) type_position: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) alias: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) nom_ld: string | null;
  @Column({ type: 'varchar', length: 128, nullable: true }) libelle_acheminement: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) nom_afnor: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) source_position: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true }) source_nom_voie: string | null;
  @Column({ type: 'varchar', length: 8, nullable: true }) certification_commune: string | null;
  @Column({ type: 'varchar', length: 2048, nullable: true }) cad_parcelles: string | null;
}
